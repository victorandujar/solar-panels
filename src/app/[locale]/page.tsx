import SolarPanelLayout from "@/app/components/SolarPlant/SolarPlant";

const HomePage: React.FC = () => {
  return (
    <section
      className="w-full h-screen flex flex-col items-center justify-center overflow-hidden pt-24 relative"
      style={{ zIndex: 1 }}
    >
      <section className="w-full h-fit relative" style={{ zIndex: 2 }}>
        <div className="w-full"></div>
        <div className="w-full ">
          <h1 className="text-xl font-bold p-5 text-black">Solar Plant</h1>
          <SolarPanelLayout />
        </div>
      </section>
    </section>
  );
};

export default HomePage;
