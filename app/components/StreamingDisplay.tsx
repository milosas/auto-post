'use client';

interface Props {
  text: string;
  isLoading: boolean;
}

export function StreamingDisplay({ text, isLoading }: Props) {
  return (
    <div className="border rounded-lg p-4 min-h-[200px] bg-gray-50">
      {!text && !isLoading && (
        <p className="text-gray-400 italic">Sugeneruotas tekstas bus rodomas čia...</p>
      )}
      {!text && isLoading && (
        <p className="text-gray-400 animate-pulse">Laukiama atsakymo...</p>
      )}
      {text && (
        <>
          <div className="whitespace-pre-wrap">{text}</div>
          {isLoading && (
            <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
          )}
        </>
      )}
    </div>
  );
}
