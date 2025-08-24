# VS Code Setup Guide for RAG Support Assistant

## Quick Setup Instructions

### 1. Prerequisites Installation

```bash
# Install Node.js (v18+)
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should show v18+
npm --version   # Should show v8+

# Install PostgreSQL
# Option A: Local installation
sudo apt install postgresql postgresql-contrib  # Ubuntu/Debian
# or
brew install postgresql  # macOS

# Option B: Use cloud database (recommended)
# Sign up for free at: https://neon.tech or https://supabase.com
```

### 2. VS Code Extensions (Required)

Install these extensions for optimal development experience:

```bash
# Install via command line
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension formulahendry.auto-rename-tag
code --install-extension ms-vscode.vscode-eslint

# Optional but recommended
code --install-extension ms-vscode.vscode-postgresql
code --install-extension ms-python.python
code --install-extension ms-toolsai.jupyter
```

### 3. Project Setup

```bash
# Clone/download your project
cd rag-support-assistant

# Install dependencies
npm install

# Create environment file
cp .env.example .env  # Or create manually

# Edit .env with your values:
DATABASE_URL=postgresql://username:password@host:5432/database
OPENAI_API_KEY=sk-your-openai-api-key
SESSION_SECRET=your-random-secret-string

# Initialize database
npm run db:push

# Start development server
npm run dev
```

### 4. VS Code Configuration Files

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "ms-vscode.vscode-typescript-next",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.suggest.autoImports": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.tsx": "typescriptreact",
    "*.ts": "typescript"
  }
}
```

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch RAG Assistant",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["--loader", "tsx/esm"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"],
      "restart": true
    },
    {
      "name": "Debug Server Only",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "true"
      },
      "runtimeArgs": ["--loader", "tsx/esm"],
      "console": "integratedTerminal"
    }
  ]
}
```

Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Server",
      "type": "npm",
      "script": "dev",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      },
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "Build Production",
      "type": "npm",
      "script": "build",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Type Check",
      "type": "npm",
      "script": "check",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Update Database Schema",
      "type": "npm",
      "script": "db:push",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    }
  ]
}
```

### 5. Development Workflow

1. **Open project in VS Code:**
   ```bash
   code .
   ```

2. **Start development server:**
   - Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
   - Type "Tasks: Run Task"
   - Select "Start Dev Server"
   - Or use terminal: `npm run dev`

3. **Access application:**
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api/health

4. **Debug with breakpoints:**
   - Set breakpoints in your TypeScript files
   - Press F5 or go to Run & Debug panel
   - Select "Launch RAG Assistant"
   - Debug session will start with full TypeScript support

### 6. Integrated Terminal Setup

Add these aliases to your terminal profile for quick commands:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias rag-dev="npm run dev"
alias rag-build="npm run build"
alias rag-check="npm run check"
alias rag-db="npm run db:push"
alias rag-test="curl http://localhost:5000/api/health"
```

### 7. Database Management

If using PostgreSQL extension:

1. Install PostgreSQL extension
2. Add database connection in VS Code:
   - Press `Ctrl+Shift+P`
   - Type "PostgreSQL: Add Connection"
   - Enter your DATABASE_URL details
3. Browse and query your database directly in VS Code

### 8. Code Snippets

Create `.vscode/snippets.json` for common patterns:

```json
{
  "React Component": {
    "prefix": "rfc",
    "body": [
      "import { $2 } from 'react';",
      "",
      "interface ${1:Component}Props {",
      "  $3",
      "}",
      "",
      "export default function $1({ $4 }: ${1:Component}Props) {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "}"
    ],
    "description": "React Function Component"
  },
  "API Route": {
    "prefix": "apiroute",
    "body": [
      "app.${1:get}('${2:/api/endpoint}', async (req, res) => {",
      "  try {",
      "    $0",
      "    res.json({ success: true });",
      "  } catch (error) {",
      "    res.status(500).json({ error: error.message });",
      "  }",
      "});"
    ],
    "description": "Express API Route"
  }
}
```

### 9. Troubleshooting in VS Code

**Common Issues and Solutions:**

1. **TypeScript errors:**
   - Run `npm run check` in terminal
   - Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

2. **Import path issues:**
   - Check `tsconfig.json` paths configuration
   - Ensure proper file extensions (.ts, .tsx)

3. **Database connection:**
   - Verify DATABASE_URL in .env
   - Check PostgreSQL service status
   - Use integrated terminal to test connection

4. **Server not starting:**
   - Check if port 5000 is available
   - Kill existing processes: `pkill -f "node.*server"`
   - Restart VS Code and try again

### 10. Production Build

For production deployment:

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "rag-assistant" -- start
```

### 11. Git Integration

VS Code has built-in Git support. Initialize if needed:

```bash
git init
git add .
git commit -m "Initial RAG Support Assistant setup"
```

Use the Source Control panel (Ctrl+Shift+G) for:
- Viewing changes
- Staging files
- Committing changes
- Managing branches

### 12. Performance Monitoring

Add these development tools for monitoring:

```bash
# Install development dependencies
npm install --save-dev @types/node nodemon concurrently

# Add to package.json scripts:
"dev:debug": "NODE_ENV=development DEBUG=* tsx server/index.ts",
"dev:watch": "nodemon --exec tsx server/index.ts"
```

Monitor performance in VS Code:
- Use integrated terminal for logs
- Debug console for real-time debugging
- Problems panel for TypeScript issues
- Output panel for build/runtime logs

This setup provides a complete development environment optimized for the RAG Support Assistant in VS Code.