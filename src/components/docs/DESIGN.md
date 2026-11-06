# Documentation UI

Starlight owns the reader layout. The components here add shared branding,
version selection and scoped Pagefind search; [the documentation design](../../../docs/DESIGN.md)
owns snapshot metadata, publication and routing rules.

Version selection preserves the current page when the target snapshot has it,
otherwise it falls back to the landing page. Periods are preserved in version
URLs. Search defaults to the selected release line; all-version filtering uses
Pagefind's explicit `any` expression. Every result shows its version.
