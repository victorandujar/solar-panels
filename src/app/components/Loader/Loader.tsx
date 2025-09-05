import { CircularProgress } from "@mui/material";

interface LoaderProps {
  width: string;
  height: string;
}

const Loader = ({ height, width }: LoaderProps): React.ReactElement => {
  return (
    <div className="h-screen w-screen z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <CircularProgress
        color="secondary"
        style={{ width: width, height: height }}
      />
    </div>
  );
};

export default Loader;
