import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPost, uploadFile } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/posts/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const { mutate, isPending } = useMutation({
		mutationFn: createPost,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			router.navigate({ to: "/" });
		},
	});

	const form = useForm({
		defaultValues: {
			title: "",
			body: "",
			image: null as string | null,
		},
		onSubmit: async ({ value }) => {
			let finalImageUrl = value.image;

			// If a file is selected, upload it first
			if (selectedFile) {
				try {
					setIsUploading(true);
					const uploadResult = await uploadFile(selectedFile);
					finalImageUrl = uploadResult.publicUrl;
				} catch {
					// Continue with post creation even if image upload fails
				} finally {
					setIsUploading(false);
				}
			}

			mutate({
				title: value.title,
				body: value.body,
				image: finalImageUrl || undefined,
			});
		},
	});

	return (
		<div className="container mx-auto px-4 py-8 max-w-2xl">
			<Link to="/">
				<ArrowLeftIcon className="w-4 h-4" />
			</Link>
			<h1 className="text-2xl font-bold mb-6">Create New Post</h1>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				<form.Field
					name="title"
					validators={{
						onChange: ({ value }) =>
							!value
								? "Title is required"
								: value.length < 3
									? "Title must be at least 3 characters"
									: undefined,
					}}
				>
					{(field) => (
						<div className="space-y-2">
							<label
								htmlFor={field.name}
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Title
							</label>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter post title"
							/>
							{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 && (
									<em className="text-sm text-destructive">
										{field.state.meta.errors.join(", ")}
									</em>
								)}
						</div>
					)}
				</form.Field>

				<form.Field
					name="body"
					validators={{
						onChange: ({ value }) =>
							!value
								? "Body is required"
								: value.length < 10
									? "Body must be at least 10 characters"
									: undefined,
					}}
				>
					{(field) => (
						<div className="space-y-2">
							<label
								htmlFor={field.name}
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Body
							</label>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter post content"
								rows={10}
							/>
							{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 && (
									<em className="text-sm text-destructive">
										{field.state.meta.errors.join(", ")}
									</em>
								)}
						</div>
					)}
				</form.Field>

				<form.Field name="image">
					{(field) => (
						<div className="space-y-2">
							<label
								htmlFor="image"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Image (optional)
							</label>
							<FileUpload
								onFileChange={(file) => {
									setSelectedFile(file);
									field.handleChange(null);
								}}
								previewUrl={imageUrl}
								onRemove={() => {
									setSelectedFile(null);
									setImageUrl(null);
									field.handleChange(null);
								}}
							/>
						</div>
					)}
				</form.Field>

				<div className="flex justify-end">
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								disabled={!canSubmit || isPending || isUploading}
							>
								{isUploading
									? "Uploading image..."
									: isPending || isSubmitting
										? "Creating..."
										: "Create Post"}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}
