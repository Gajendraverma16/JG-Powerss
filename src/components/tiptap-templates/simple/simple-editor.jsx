import * as React from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";

// --- Custom Extensions ---
import { Link } from "@/components/tiptap-extension/link-extension";
import { Selection } from "@/components/tiptap-extension/selection-extension";
import { TrailingNode } from "@/components/tiptap-extension/trailing-node-extension";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// --- Hooks ---
import { useMobile } from "@/hooks/use-mobile";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

import content from "@/components/tiptap-templates/simple/data/content.json";

const MainToolbarContent = ({ onHighlighterClick, onLinkClick, isMobile }) => {
  return (
    <>
      <Spacer />
      <ToolbarGroup className="bg-white rounded-md p-1 shadow-sm">
        <UndoRedoButton
          action="undo"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <UndoRedoButton
          action="redo"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
      </ToolbarGroup>
      <ToolbarSeparator className="bg-gray-300" />
      <ToolbarGroup className="bg-white rounded-md p-1 shadow-sm">
        <HeadingDropdownMenu
          levels={[1, 2, 3, 4]}
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <BlockquoteButton className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md" />
        <CodeBlockButton className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md" />
      </ToolbarGroup>
      <ToolbarSeparator className="bg-gray-300" />
      <ToolbarGroup className="bg-white rounded-md p-1 shadow-sm">
        <MarkButton
          type="bold"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <MarkButton
          type="italic"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <MarkButton
          type="strike"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <MarkButton
          type="code"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <MarkButton
          type="underline"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton
            onClick={onHighlighterClick}
            className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
          />
        )}
        {!isMobile ? (
          <LinkPopover />
        ) : (
          <LinkButton
            onClick={onLinkClick}
            className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
          />
        )}
      </ToolbarGroup>
      <ToolbarSeparator className="bg-gray-300" />
      <ToolbarGroup className="bg-white rounded-md p-1 shadow-sm">
        <MarkButton
          type="superscript"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <MarkButton
          type="subscript"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
      </ToolbarGroup>
      <ToolbarSeparator className="bg-gray-300" />
      <ToolbarGroup className="bg-white rounded-md p-1 shadow-sm">
        <TextAlignButton
          align="left"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <TextAlignButton
          align="center"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <TextAlignButton
          align="right"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
        <TextAlignButton
          align="justify"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
      </ToolbarGroup>
      <ToolbarSeparator className="bg-gray-300" />
      <ToolbarGroup className="bg-white rounded-md p-1 shadow-sm">
        <ImageUploadButton
          text="Add"
          className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
        />
      </ToolbarGroup>
      <Spacer />
      {isMobile && <ToolbarSeparator className="bg-gray-300" />}
      <ToolbarGroup className="bg-white rounded-md p-1 shadow-sm">
        <ThemeToggle className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md" />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({ type, onBack }) => (
  <>
    <ToolbarGroup className="bg-white rounded-md p-1 shadow-sm">
      <Button
        data-style="ghost"
        onClick={onBack}
        className="text-[#003A72] hover:bg-gray-100 p-2 rounded-md"
      >
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator className="bg-gray-300" />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

export function SimpleEditor({ initialContent, onUpdate }) {

  const isMobile = useMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = React.useState("main");
  const toolbarRef = React.useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
      },
    },
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,

      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      TrailingNode,
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent, // Use initialContent if provided, otherwise fallback to default
    onUpdate: ({ editor }) => {
      onUpdate({ html: editor.getHTML(), json: editor.getJSON() });
    },
  });

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  return (
    <EditorContext.Provider value={{ editor }}>
      <Toolbar
        ref={toolbarRef}
        className="bg-[#003A72] rounded-t-lg p-2 shadow-md z-10 "
        style={
          isMobile
            ? {
                bottom: `calc(100% - ${windowSize.height - bodyRect.y}px)`,
              }
            : {}
        }
      >
        {mobileView === "main" ? (
          <MainToolbarContent
            onHighlighterClick={() => setMobileView("highlighter")}
            onLinkClick={() => setMobileView("link")}
            isMobile={isMobile}
          />
        ) : (
          <MobileToolbarContent
            type={mobileView === "highlighter" ? "highlighter" : "link"}
            onBack={() => setMobileView("main")}
          />
        )}
      </Toolbar>
      <div className="content-wrapper md:p-4  rounded-b-lg border border-gray-200">
        <EditorContent
          editor={editor}

          className="simple-editor-content"
        />
      </div>
    </EditorContext.Provider>
  );
}
//before changing anything
