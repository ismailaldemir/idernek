import "./Campaigns.css";
import CampaignItem from "./CampaignItem";

const Campaings = () => {
  return (
    <section className="campaigns">
      <div className="container">
        <div className="campaigns-wrapper">
          <CampaignItem />
        </div>
        <div className="campaigns-wrapper">
          <CampaignItem />
        </div>
      </div>
    </section>
  );
};

export default Campaings;
