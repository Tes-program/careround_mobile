#!/bin/bash

echo "Writing google-services.json from environment variable..."

if [ -z "$GOOGLE_SERVICES_JSON" ]; then
  echo "ERROR: GOOGLE_SERVICES_JSON environment variable is not set"
  exit 1
fi

echo "$GOOGLE_SERVICES_JSON" | base64 --decode > "$EAS_BUILD_WORKINGDIR/google-services.json"

echo "google-services.json written successfully"