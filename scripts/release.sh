#!/bin/bash

# Release script for homebridge-serverstatus
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the main branch to create a release"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Working directory is not clean. Please commit or stash your changes."
    git status --short
    exit 1
fi

# Get version type (default to patch)
VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "❌ Error: Invalid version type. Use: patch, minor, or major"
    exit 1
fi

echo "🚀 Starting release process..."

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Build the project
echo "🔨 Building project..."
npm run build

# Bump version
echo "⬆️  Bumping $VERSION_TYPE version..."
npm version $VERSION_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📦 New version: $NEW_VERSION"

# Create commit with version bump
echo "📝 Creating commit..."
git add package.json package-lock.json
git commit -m "🔖 Release v$NEW_VERSION

- Bump version to $NEW_VERSION
- Ready for npm publishing"

# Create and push tag
echo "🏷️  Creating tag..."
git tag "v$NEW_VERSION"

echo "📤 Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

echo "✅ Release v$NEW_VERSION created successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. GitHub Actions will automatically publish to npm"
echo "2. Check the Actions tab on GitHub for publish status"
echo "3. Verify the package on https://www.npmjs.com/package/homebridge-serverstatus"
echo ""
echo "📋 Installation command for users:"
echo "npm install -g homebridge-serverstatus@$NEW_VERSION" 