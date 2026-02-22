export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;

  return (
    <div className="flex h-full items-center justify-center bg-bg-secondary">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-semibold text-text-primary">
          Message: {messageId}
        </h1>
        <p className="text-base text-text-secondary">
          Message viewer will be implemented in Agent 5
        </p>
      </div>
    </div>
  );
}
