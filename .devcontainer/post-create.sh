#!/usr/bin/env bash
# Runs once after the devcontainer is created (postCreateCommand).
set -euo pipefail

# k6 (https://github.com/grafana/k6/releases)
K6_VERSION="1.8.2"
curl -fsSL "https://github.com/grafana/k6/releases/download/v${K6_VERSION}/k6-v${K6_VERSION}-linux-$(dpkg --print-architecture).tar.gz" |
  sudo tar -xz -C /usr/local/bin --strip-components=1 --wildcards '*/k6'
k6 version

# claude-code (https://code.claude.com/docs/en/quickstart#step-1-install-claude-code)
curl -fsSL https://claude.ai/install.sh | bash
