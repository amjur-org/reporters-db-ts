#!/bin/bash

# Test script for reporters-db-ts
# Pipes stderr to stdout so all output is visible

echo "Running reporters-db-ts test suite..."
echo "======================================="

# Run tests with stderr piped to stdout
npm test 2>&1

# Capture the exit code
exit_code=$?

echo ""
echo "======================================="
if [ $exit_code -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Tests failed with exit code: $exit_code"
fi

exit $exit_code
