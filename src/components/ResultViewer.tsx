interface ResultViewerProps {
  result: any;
}

const ResultViewer = ({ result }: ResultViewerProps) => {
  return (
    <div>
      <h3>Result Viewer</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
};

export default ResultViewer;
