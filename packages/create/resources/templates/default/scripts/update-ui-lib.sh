#!/usr/bin/env bash
set -euo pipefail

### Default Configuration ###
TEMPLATE_REPO_URL="git@github.com:contember/contember.git" # Template repository URL
TEMPLATE_DIR="packages/react-ui-lib/src"                  # Directory to filter from template repo
OLD_COMMIT="9fc76ce46eb9d9196a88eeb01c7305b182dde7dd"     # Default base commit or tag
NEW_COMMIT="main"                                         # Default branch or commit with latest changes
TARGET_DIR="admin/lib"                                    # Directory to map the filtered content into
CLONE_DIR=".tmp-ui-lib-update"                            # Temporary clone directory
REMOTE_NAME="ui-lib-update-temp"                          # Temporary remote name
COMMIT_FILE="$TARGET_DIR/COMMIT"                          # File to store the new commit hash
FORCE_MODE=false                                          # Default to non-force mode
### End Default Configuration ###

# Function to show help message
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --force               Replace target directory without cherry-picking"
    echo "  --from COMMIT         Specify base commit, tag, or branch (default: from COMMIT file or $OLD_COMMIT)"
    echo "  --to COMMIT           Specify target commit, tag, or branch (default: $NEW_COMMIT)"
    echo "  --repo URL            Specify template repository URL (default: $TEMPLATE_REPO_URL)"
    echo "  --template-dir DIR    Specify template directory within repo (default: $TEMPLATE_DIR)"
    echo "  --target-dir DIR      Specify target directory in this project (default: $TARGET_DIR)"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --to v5.0.0                 # Update to tag v5.0.0"
    echo "  $0 --from v4.0.0 --to v5.0.0   # Update from tag v4.0.0 to v5.0.0"
    echo "  $0 --to feature-branch --force # Force update to a feature branch"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE_MODE=true
      shift
      ;;
    --from)
      if [ -z "${2:-}" ]; then
        echo "Error: --from requires a commit, tag, or branch name"
        exit 1
      fi
      OLD_COMMIT="$2"
      shift 2
      ;;
    --to)
      if [ -z "${2:-}" ]; then
        echo "Error: --to requires a commit, tag, or branch name"
        exit 1
      fi
      NEW_COMMIT="$2"
      shift 2
      ;;
    --repo)
      if [ -z "${2:-}" ]; then
        echo "Error: --repo requires a URL"
        exit 1
      fi
      TEMPLATE_REPO_URL="$2"
      shift 2
      ;;
    --template-dir)
      if [ -z "${2:-}" ]; then
        echo "Error: --template-dir requires a directory path"
        exit 1
      fi
      TEMPLATE_DIR="$2"
      shift 2
      ;;
    --target-dir)
      if [ -z "${2:-}" ]; then
        echo "Error: --target-dir requires a directory path"
        exit 1
      fi
      TARGET_DIR="$2"
      COMMIT_FILE="$TARGET_DIR/COMMIT"  # Update COMMIT file path
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo "Running in $([ "$FORCE_MODE" = true ] && echo "FORCE" || echo "normal") mode"
echo "Using repository: $TEMPLATE_REPO_URL"
echo "Template directory: $TEMPLATE_DIR"
echo "Target directory: $TARGET_DIR"

# Ensure cleanup on exit
cleanup() {
    echo "Cleaning up temporary files..."
    rm -rf "$CLONE_DIR"
    git remote remove "$REMOTE_NAME" 2>/dev/null || true
}
trap cleanup EXIT

# Pre-step: Ensure the repository is clean (skip check if in force mode)
if [[ "$FORCE_MODE" = false ]] && [[ -n $(git status --porcelain) ]]; then
  echo "There are modified or untracked files in the repository."
  exit 1
fi

# Step 0: Load OLD_COMMIT from COMMIT file, if available and not explicitly specified
if [ -f "$COMMIT_FILE" ] && [ "$OLD_COMMIT" = "9fc76ce46eb9d9196a88eeb01c7305b182dde7dd" ]; then
    OLD_COMMIT=$(cat "$COMMIT_FILE")
    echo "Loaded OLD_COMMIT from $COMMIT_FILE: $OLD_COMMIT"
fi

echo "Updating from: $OLD_COMMIT"
echo "Updating to: $NEW_COMMIT"

# Step 1: Clone the template repository with sparse checkout
echo "Cloning the template repository into $CLONE_DIR..."
rm -rf "$CLONE_DIR"
mkdir -p "$CLONE_DIR"
cd "$CLONE_DIR"
git init --quiet
git remote add origin "$TEMPLATE_REPO_URL"

echo "Configuring sparse checkout for $TEMPLATE_DIR..."
git sparse-checkout init --cone
git sparse-checkout set "$TEMPLATE_DIR"

# Step 2: Fetch specific references more efficiently
echo "Fetching specific references..."

# Check if inputs look like tags (starting with 'v' is a common convention)
if [[ "$OLD_COMMIT" =~ ^v[0-9] ]] || [[ "$NEW_COMMIT" =~ ^v[0-9] ]]; then
    # If either reference looks like a tag, fetch only the specific tags needed
    if [[ "$OLD_COMMIT" =~ ^v[0-9] ]]; then
        echo "Fetching tag: $OLD_COMMIT"
        git fetch origin "refs/tags/$OLD_COMMIT:refs/tags/$OLD_COMMIT" --depth=1
    else
        echo "Fetching commit/branch: $OLD_COMMIT"
        git fetch origin "$OLD_COMMIT" --depth=1
    fi

    if [[ "$NEW_COMMIT" =~ ^v[0-9] ]]; then
        echo "Fetching tag: $NEW_COMMIT"
        git fetch origin "refs/tags/$NEW_COMMIT:refs/tags/$NEW_COMMIT" --depth=1
    else
        echo "Fetching commit/branch: $NEW_COMMIT"
        git fetch origin "$NEW_COMMIT" --depth=1
    fi
else
    # If they don't look like tags, just fetch them directly
    echo "Fetching commits/branches: $OLD_COMMIT and $NEW_COMMIT"
    git fetch origin "$OLD_COMMIT" "$NEW_COMMIT" --depth=1
fi

# Step 3: Resolve the references to actual commit hashes
echo "Resolving commit references..."

# Function to resolve a reference to a commit hash
resolve_ref() {
    local ref=$1
    local hash

    # Try different ways to resolve the reference
    if hash=$(git rev-parse --quiet --verify "$ref" 2>/dev/null); then
        echo "$hash"
    elif hash=$(git rev-parse --quiet --verify "origin/$ref" 2>/dev/null); then
        echo "$hash"
    elif [[ "$ref" =~ ^v[0-9] ]] && hash=$(git rev-parse --quiet --verify "refs/tags/$ref" 2>/dev/null); then
        echo "$hash"
    else
        # If we still can't resolve it, try to fetch it directly as a tag
        git fetch origin "refs/tags/$ref:refs/tags/$ref" --depth=1 2>/dev/null || true

        if hash=$(git rev-parse --quiet --verify "refs/tags/$ref" 2>/dev/null); then
            echo "$hash"
        else
            # If all else fails, return the input (might be a direct hash)
            echo "$ref"
        fi
    fi
}

OLD_COMMIT_HASH=$(resolve_ref "$OLD_COMMIT")
NEW_COMMIT_HASH=$(resolve_ref "$NEW_COMMIT")

echo "Resolved OLD_COMMIT to: $OLD_COMMIT_HASH"
echo "Resolved NEW_COMMIT to: $NEW_COMMIT_HASH"

# Step 4: Check out the resolved commits
echo "Checking out the old code..."
if ! git checkout "$OLD_COMMIT_HASH" -- "$TEMPLATE_DIR"; then
    echo "Error: Failed to checkout $OLD_COMMIT_HASH"
    exit 1
fi

# Try formatting, but don't fail if biome is not available or nothing changes
if command -v biome &> /dev/null; then
    echo "Formatting code with biome..."
    biome check --write "$TEMPLATE_DIR" 2>/dev/null || true

    # Only commit if there are actual changes
    if [[ -n $(git status --porcelain "$TEMPLATE_DIR") ]]; then
        git add "$TEMPLATE_DIR"
        git commit -m "Format code base at $OLD_COMMIT"
        FORMAT_COMMIT=$(git rev-parse HEAD)
        echo "Formatting commit created: $FORMAT_COMMIT"
    else
        echo "No formatting changes detected, using $OLD_COMMIT_HASH directly"
        FORMAT_COMMIT=$OLD_COMMIT_HASH
    fi
else
    echo "Biome not found, skipping formatting step"
    FORMAT_COMMIT=$OLD_COMMIT_HASH
fi

# Step 5: Checkout the new commit
echo "Checking out the new code..."
if ! git checkout "$NEW_COMMIT_HASH" -- "$TEMPLATE_DIR"; then
    echo "Error: Failed to checkout $NEW_COMMIT_HASH"
    exit 1
fi

# Capture the actual commit hash of the new commit for the COMMIT file
NEW_COMMIT_REF=$NEW_COMMIT_HASH
echo "New commit reference: $NEW_COMMIT_REF"

# Step 6: Reset and stage only the sparse directory
echo "Preparing changes..."
git reset "$FORMAT_COMMIT" -- "$TEMPLATE_DIR"

# Format new code if biome is available
if command -v biome &> /dev/null; then
    echo "Formatting new code with biome..."
    biome check --write "$TEMPLATE_DIR" 2>/dev/null || true
fi

git add "$TEMPLATE_DIR" # Stage only the files in the sparse directory

# Step 7: Create the squashed commit
echo "Creating a commit with changes..."

# Only commit if there are actual changes
if [[ -n $(git status --porcelain "$TEMPLATE_DIR") ]]; then
    git commit -m "Update UI lib to $NEW_COMMIT"
else
    echo "No changes detected between $OLD_COMMIT and $NEW_COMMIT in $TEMPLATE_DIR"
    exit 0
fi

# Capture the squashed commit hash for normal mode
SQUASHED_COMMIT=$(git rev-parse HEAD)
echo "Commit created: $SQUASHED_COMMIT"

# Return to the main repository
cd - # Return to the main repository

if [ "$FORCE_MODE" = true ]; then
    # FORCE MODE: directly replace the target directory
    echo "Force mode: directly replacing $TARGET_DIR..."

    # Remove the target directory if it exists
    if [ -d "$TARGET_DIR" ]; then
        echo "Removing existing $TARGET_DIR directory"
        rm -rf "$TARGET_DIR"
    fi

    # Create target parent directory if needed
    mkdir -p "$(dirname "$TARGET_DIR")"

    # Copy files directly from source template directory in temporary repo
    echo "Copying new files from template to target directory"
    cp -r "$CLONE_DIR/$TEMPLATE_DIR" "$TARGET_DIR"

    # Remove files that should not be included
    if [ -f "$TARGET_DIR/index.ts" ]; then
        echo "Removing $TARGET_DIR/index.ts"
        rm "$TARGET_DIR/index.ts"
    fi
    if [ -f "$TARGET_DIR/tsconfig.json" ]; then
        echo "Removing $TARGET_DIR/tsconfig.json"
        rm "$TARGET_DIR/tsconfig.json"
    fi

    # Write the new commit hash to the COMMIT file
    echo "Writing new commit reference to $COMMIT_FILE"
    echo "$NEW_COMMIT_REF" > "$COMMIT_FILE"

    echo "Force update complete. You'll need to manually add and commit the changes."
    echo "To review and commit changes: git add $TARGET_DIR && git commit -m \"Update UI lib to $NEW_COMMIT\""
else
    # NORMAL MODE: first perform the directory move in the temp repo
    echo "Moving files in temporary repository..."
    cd "$CLONE_DIR"
    mkdir -p "$(dirname "$TARGET_DIR")"
    cp -r "$TEMPLATE_DIR" "$TARGET_DIR"

    # Remove files that should not be included
    if [ -f "$TARGET_DIR/index.ts" ]; then
        rm "$TARGET_DIR/index.ts"
    fi
    if [ -f "$TARGET_DIR/tsconfig.json" ]; then
        rm "$TARGET_DIR/tsconfig.json"
    fi

    # Add the changes
    git add "$TARGET_DIR"
    git commit --amend --no-edit

    # Update the squashed commit reference
    SQUASHED_COMMIT=$(git rev-parse HEAD)
    cd - # Return to main repository

    # NORMAL MODE: use cherry-pick to merge changes
    echo "Adding the temporary repository as a remote to the main repository..."
    git remote remove "$REMOTE_NAME" 2>/dev/null || true
    git remote add "$REMOTE_NAME" "file://$PWD/$CLONE_DIR"
    git fetch "$REMOTE_NAME" "$SQUASHED_COMMIT"

    # Cherry-pick the squashed commit
    echo "Cherry-picking the squashed commit into the current branch..."
    if git cherry-pick "$SQUASHED_COMMIT" --no-commit; then
        echo "Cherry-pick completed successfully."
    else
        echo "Cherry-pick encountered conflicts. Please resolve them and run:"
        echo "  git cherry-pick --continue"
        exit 1
    fi

    # Write the new commit hash to admin/lib/COMMIT
    echo "Writing new commit reference to $COMMIT_FILE"
    echo "$NEW_COMMIT_REF" > "$COMMIT_FILE"

    echo "Process completed successfully. Review the changes and commit them."
fi

# Cleanup handled by trap
echo "Done."
