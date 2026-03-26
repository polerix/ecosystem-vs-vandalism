# GitHub Naming Convention Standard

**Established**: 2026-03-26  
**Format**: Kebab-case for all files and folders, Title Case for project/directory names (on creation)  
**Purpose**: Consistent, repeatable, maintainable naming across all repositories

## Folder Structure Convention

### Root Level Organization
```
/project-name/
├── docs/                    # Documentation
├── images/                  # Image assets
├── resources/               # Non-code resources (data, configs, etc.)
├── scripts/                 # Executable scripts
├── src/                     # Source code
├── tests/                   # Test files
├── .github/                 # GitHub-specific files
└── README.md               # Project overview
```

## File Naming Rules

### 1. **Folders** (kebab-case)
- Format: `lowercase-with-hyphens`
- Examples: `project-name`, `image-assets`, `utility-scripts`
- No spaces, no underscores, no mixed case

### 2. **Images** (kebab-case + extension)
- Format: `descriptive-name-version.ext`
- Examples: `logo-primary-v1.png`, `screenshot-dashboard-01.jpg`
- Version suffix: `-v1`, `-v2` for iterations, or `-01`, `-02` for numbered series
- Extensions: `.png`, `.jpg`, `.svg`, `.gif`

### 3. **Resources** (kebab-case + extension)
- Format: `resource-type-descriptive-name.ext`
- Examples: `config-production.json`, `template-email-welcome.html`, `data-sample-users.csv`
- Include context in filename (config, template, data, etc.)

### 4. **Scripts** (kebab-case + extension)
- Format: `verb-object-description.ext`
- Examples: `build-docker-image.sh`, `deploy-to-prod.js`, `sync-database-backup.py`
- Start with action verb (build, deploy, sync, fetch, export, etc.)

### 5. **Code Files**
- Format: kebab-case for filenames
- Examples: `user-service.js`, `auth-middleware.py`, `database-schema.sql`
- Keep names short but descriptive

## Reference Updates

When renaming files/folders, update references in:
- Code imports/requires
- README files
- Documentation links
- Configuration files
- GitHub Actions workflows
- Any hardcoded file paths

## Version Control

All changes to be logged with:
- Timestamp
- Old name → New name
- Reason for change
- Files updated in code/docs

---

**Last Updated**: 2026-03-26
