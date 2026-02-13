import { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/**
 * RichEditor — Reusable rich text editor component.
 *
 * Wraps ReactQuill with dark-mode styling and a curated toolbar.
 *
 * @param {{ value: string, onChange: (html: string) => void, placeholder?: string }} props
 */
export default function RichEditor({ value, onChange, placeholder = "Tulis di sini…" }) {
    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "clean"],
        ],
    }), []);

    const formats = [
        "header",
        "bold", "italic", "underline",
        "list",
        "link",
    ];

    return (
        <div className="quill-dark">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
        </div>
    );
}
