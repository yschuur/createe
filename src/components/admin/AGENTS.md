## Admin component rules
- All admin photo/video fields pick from the shared media library (media_assets table + MediaField/MediaLibraryDialog in src/components/admin/MediaLibrary.tsx); uploads go to the private studio-assets bucket under media/ with long-lived signed URLs — one reusable source of media because public buckets are blocked.
- RichTextEditor renders EditorContent as soon as its editor exists, with toolbar state fallbacks — remounting a populated field must not leave an invisible editor waiting for its first transaction.
- Page media stores validated percentage focus coordinates beside legacy positions; ImageFocusEditor drags crops and makePageView resolves object-position — preserves source images without schema changes.
