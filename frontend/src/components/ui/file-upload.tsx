import { cn } from "@/lib/utils";
import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";

export interface FileUploadProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
	onFileChange?: (file: File | null) => void;
	previewUrl?: string | null;
	onRemove?: () => void;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
	({ className, onFileChange, previewUrl, onRemove, ...props }, ref) => {
		const [preview, setPreview] = React.useState<string | null>(
			previewUrl || null,
		);
		const fileInputRef = React.useRef<HTMLInputElement>(null);

		React.useEffect(() => {
			setPreview(previewUrl || null);
		}, [previewUrl]);

		const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0] || null;
			if (file) {
				const reader = new FileReader();
				reader.onloadend = () => {
					setPreview(reader.result as string);
				};
				reader.readAsDataURL(file);
				onFileChange?.(file);
			}
		};

		const handleRemove = () => {
			setPreview(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			onFileChange?.(null);
			onRemove?.();
		};

		return (
			<div className="space-y-2">
				<div className="flex items-center gap-4">
					<Input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						className={cn("cursor-pointer", className)}
						{...props}
					/>
					{preview && (
						<Button
							type="button"
							variant="outline"
							onClick={handleRemove}
							className="text-destructive"
						>
							Remove
						</Button>
					)}
				</div>
				{preview && (
					<div className="mt-4">
						<img
							src={preview}
							alt="Preview"
							className="max-w-full h-auto max-h-64 rounded-md border"
						/>
					</div>
				)}
			</div>
		);
	},
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
