# TODO for Local GitHub Dependency Workflow

## 1. xtrax Package Issues
- [ ] Ensure xtrax repo builds a `dist/` directory when installed from GitHub
- [ ] Add a `prepare` or `postinstall` script to xtrax that runs `npm install` and `npm run build` (or `tsc`)
- [ ] Ensure all dependencies (e.g., TypeScript) are listed in xtrax's `devDependencies`
- [ ] Confirm xtrax's `package.json` `exports` and `main` fields point to built files in `dist/`
- [ ] Test that `npm install syntropiq/xtrax` in a clean project results in a working build

## 2. reporters-db-ts Project
- [ ] Remove and reinstall `@syntropiq/xtrax` after xtrax is fixed
- [ ] Verify that `npm test` passes and all imports from xtrax resolve
- [ ] Document the workflow for local development and debugging with a GitHub dependency

## 3. Optional Improvements
- [ ] Add a troubleshooting section to the README for common issues with local/GitHub dependencies
- [ ] Consider using `npm link` for rapid local development if both repos are on the same machine

---

Edit this file as we work through the steps. Open the xtrax folder next so we can address the build and packaging issues there.
