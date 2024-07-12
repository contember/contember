DSN=$CONTEMBER_DEPLOY_DSN
PROJECT_NAME=$(echo $DSN | sed -n 's/contember:\/\/\(.*\):.*@.*/\1/p')
TOKEN=$(echo $DSN | sed -n 's/.*:\(.*\)@.*/\1/p')
PROJECT_API_URL=$(echo $DSN | sed -n 's/.*@\(.*\)/\1/p')
ENDPOINT="https://api-$PROJECT_API_URL/actions/$PROJECT_NAME"
ESCAPED_JSON_VARIABLES=$(echo $CONTEMBER_ACTIONS_VARIABLES | sed 's/"/\\"/g')

# Prepare the GraphQL mutation
MUTATION="mutation { setVariables(args: { variables: $ESCAPED_JSON_VARIABLES }) { ok } }"

# Build the curl command as a string
CURL_COMMAND="curl -s -X POST '$ENDPOINT' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer $TOKEN' \
-d '{\"query\": \"$MUTATION\"}' \
-w '%{http_code}'"

# Execute the curl command and capture the response
RESPONSE=$(eval $CURL_COMMAND)

# Extract HTTP status code from the response
HTTP_STATUS=$(echo "$RESPONSE" | awk '{print substr($0, length($0)-2, 3)}')

# Extract the response body from the response
BODY=$(echo "$RESPONSE" | awk '{print substr($0, 1, length($0)-3)}')

echo "HTTP Status: $HTTP_STATUS"
echo "Response Body: $BODY"

# Check if the HTTP status code is 200 and the response includes "ok: true"
if [[ $HTTP_STATUS == 200 && $BODY == *'"ok":true'* ]]; then
  echo "Action variables set successfully."
else
  echo "Action variables setting failed."
  exit 1
fi
