#!/usr/bin/env bash
set -euo pipefail

### Default Configuration ###
TEMPLATE_REPO_URL="git@github.com:contember/contember.git" # Template repository URL
PACKAGES_SUBDIR="packages"                               # Where the UI-lib packages live in the repo
OLD_COMMIT="9fc76ce46eb9d9196a88eeb01c7305b182dde7dd"     # Default base commit or tag
NEW_COMMIT="main"                                         # Default branch or commit with latest changes
TARGET_DIR="admin/lib"                                    # Directory to map the assembled content into
CLONE_DIR=".tmp-ui-lib-update"                            # Temporary clone directory (source packages)
BUILD_DIR=".tmp-ui-lib-build"                             # Temporary git repo holding the assembled lib
REMOTE_NAME="ui-lib-update-temp"                          # Temporary remote name
COMMIT_FILE="$TARGET_DIR/COMMIT"                          # File to store the new commit hash
FORCE_MODE=false                                          # Default to non-force mode
### End Default Configuration ###

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSEMBLE="$SCRIPT_DIR/assemble-ui-lib.mjs"

# The UI lib is assembled from these packages (base + tenant + the high-level lib).
# Older revisions only had the single react-ui-lib package; assemble-ui-lib.mjs
# detects that and falls back to the legacy single-package layout.
UI_LIB_PACKAGES=("react-ui-lib" "react-ui-lib-base" "react-ui-lib-tenant")

# Function to show help message
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Updates admin/lib by assembling the Contember UI-lib packages and"
    echo "cherry-picking the upstream changes onto your (possibly customised) copy."
    echo ""
    echo "Options:"
    echo "  --force               Replace target directory without cherry-picking"
    echo "  --from COMMIT         Specify base commit, tag, or branch (default: from COMMIT file or $OLD_COMMIT)"
    echo "  --to COMMIT           Specify target commit, tag, or branch (default: $NEW_COMMIT)"
    echo "  --repo URL            Specify template repository URL (default: $TEMPLATE_REPO_URL)"
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

if [ ! -f "$ASSEMBLE" ]; then
  echo "Error: assembler not found at $ASSEMBLE"
  echo "Make sure scripts/assemble-ui-lib.mjs is present (it ships next to this script)."
  exit 1
fi

echo "Running in $([ "$FORCE_MODE" = true ] && echo "FORCE" || echo "normal") mode"
echo "Using repository: $TEMPLATE_REPO_URL"
echo "Target directory: $TARGET_DIR"

# Ensure cleanup on exit
cleanup() {
    echo "Cleaning up temporary files..."
    rm -rf "$CLONE_DIR" "$BUILD_DIR"
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

# Step 1: Clone the template repository with sparse checkout of the UI-lib package sources
echo "Cloning the template repository into $CLONE_DIR..."
rm -rf "$CLONE_DIR"
mkdir -p "$CLONE_DIR"
(
  cd "$CLONE_DIR"
  git init --quiet
  git remote add origin "$TEMPLATE_REPO_URL"
  git sparse-checkout init --cone
  SPARSE_PATHS=()
  for pkg in "${UI_LIB_PACKAGES[@]}"; do
    SPARSE_PATHS+=("$PACKAGES_SUBDIR/$pkg/src")
  done
  git sparse-checkout set "${SPARSE_PATHS[@]}"
)

# Step 2: Fetch the references
fetch_ref() {
    local ref="$1"
    if [[ "$ref" =~ ^v[0-9] ]]; then
        echo "Fetching tag: $ref"
        git -C "$CLONE_DIR" fetch origin "refs/tags/$ref:refs/tags/$ref" --depth=1
    else
        echo "Fetching commit/branch: $ref"
        git -C "$CLONE_DIR" fetch origin "$ref" --depth=1
    fi
}
fetch_ref "$OLD_COMMIT"
fetch_ref "$NEW_COMMIT"

# Step 3: Resolve the references to actual commit hashes
resolve_ref() {
    local ref="$1" hash
    if hash=$(git -C "$CLONE_DIR" rev-parse --quiet --verify "$ref" 2>/dev/null); then
        echo "$hash"
    elif hash=$(git -C "$CLONE_DIR" rev-parse --quiet --verify "origin/$ref" 2>/dev/null); then
        echo "$hash"
    elif [[ "$ref" =~ ^v[0-9] ]] && hash=$(git -C "$CLONE_DIR" rev-parse --quiet --verify "refs/tags/$ref" 2>/dev/null); then
        echo "$hash"
    else
        git -C "$CLONE_DIR" fetch origin "refs/tags/$ref:refs/tags/$ref" --depth=1 2>/dev/null || true
        if hash=$(git -C "$CLONE_DIR" rev-parse --quiet --verify "refs/tags/$ref" 2>/dev/null); then
            echo "$hash"
        else
            echo "$ref"
        fi
    fi
}

OLD_COMMIT_HASH=$(resolve_ref "$OLD_COMMIT")
NEW_COMMIT_HASH=$(resolve_ref "$NEW_COMMIT")
echo "Resolved OLD_COMMIT to: $OLD_COMMIT_HASH"
echo "Resolved NEW_COMMIT to: $NEW_COMMIT_HASH"
NEW_COMMIT_REF="$NEW_COMMIT_HASH"

# Helper: check out the UI-lib package sources at a given commit into CLONE_DIR
checkout_packages() {
    local commit="$1"
    rm -rf "${CLONE_DIR:?}/$PACKAGES_SUBDIR"
    for pkg in "${UI_LIB_PACKAGES[@]}"; do
        local path="$PACKAGES_SUBDIR/$pkg/src"
        if git -C "$CLONE_DIR" cat-file -e "$commit:$path" 2>/dev/null; then
            git -C "$CLONE_DIR" checkout -q "$commit" -- "$path"
        fi
    done
}

# Helper: assemble admin/lib for a given commit into an absolute output directory
assemble_at() {
    local commit="$1" out="$2"
    checkout_packages "$commit"
    node "$ASSEMBLE" --packages-dir "$PWD/$CLONE_DIR/$PACKAGES_SUBDIR" --target "$out"
    if command -v biome &>/dev/null; then
        biome check --write "$out" >/dev/null 2>&1 || true
    fi
}

# Step 4: Build a temporary git repo with two commits: assembled OLD, then assembled NEW.
echo "Assembling UI lib for both revisions..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/$(dirname "$TARGET_DIR")"
git -C "$BUILD_DIR" init --quiet
git -C "$BUILD_DIR" config user.email "noreply@contember.com"
git -C "$BUILD_DIR" config user.name "Contember UI lib update"

assemble_at "$OLD_COMMIT_HASH" "$PWD/$BUILD_DIR/$TARGET_DIR"
git -C "$BUILD_DIR" add -A
git -C "$BUILD_DIR" commit -q --allow-empty -m "UI lib at $OLD_COMMIT"

rm -rf "${BUILD_DIR:?}/$TARGET_DIR"
assemble_at "$NEW_COMMIT_HASH" "$PWD/$BUILD_DIR/$TARGET_DIR"
git -C "$BUILD_DIR" add -A

if git -C "$BUILD_DIR" diff --cached --quiet; then
    echo "No changes detected between $OLD_COMMIT and $NEW_COMMIT in $TARGET_DIR"
    exit 0
fi
git -C "$BUILD_DIR" commit -q -m "Update UI lib to $NEW_COMMIT"
SQUASHED_COMMIT=$(git -C "$BUILD_DIR" rev-parse HEAD)
echo "Assembled change commit: $SQUASHED_COMMIT"

# Step 5: Apply the change to the current project
if [ "$FORCE_MODE" = true ]; then
    echo "Force mode: directly replacing $TARGET_DIR..."
    rm -rf "$TARGET_DIR"
    mkdir -p "$(dirname "$TARGET_DIR")"
    cp -r "$BUILD_DIR/$TARGET_DIR" "$TARGET_DIR"
    echo "$NEW_COMMIT_REF" > "$COMMIT_FILE"
    echo "Force update complete. Review and commit the changes:"
    echo "  git add $TARGET_DIR && git commit -m \"Update UI lib to $NEW_COMMIT\""
else
    echo "Cherry-picking the assembled change onto $TARGET_DIR..."
    git remote remove "$REMOTE_NAME" 2>/dev/null || true
    git remote add "$REMOTE_NAME" "file://$PWD/$BUILD_DIR"
    git fetch "$REMOTE_NAME" "$SQUASHED_COMMIT"

    if git cherry-pick "$SQUASHED_COMMIT" --no-commit; then
        echo "Cherry-pick completed successfully."
    else
        echo "Cherry-pick encountered conflicts. Please resolve them, then run:"
        echo "  git cherry-pick --continue   (or stage the resolved files)"
        echo "$NEW_COMMIT_REF" > "$COMMIT_FILE"
        exit 1
    fi
    echo "$NEW_COMMIT_REF" > "$COMMIT_FILE"
    echo "Process completed successfully. Review the changes and commit them."
fi

# Cleanup handled by trap
echo "Done."
