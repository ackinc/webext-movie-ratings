export default function CheckmarkOnCircle({ style }: { style?: object }) {
  return (
    <svg
      viewBox="0 0 16 16"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style }}
    >
      <path d="M8 0c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM9 13h-2v-2h2v2zM9 10h-2v-7h2v7z"></path>
    </svg>
  );
}
