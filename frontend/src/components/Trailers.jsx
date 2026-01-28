import React from "react";
import { trailersStyles, trailersCSS } from "../assets/dummyStyles";
import { trailersData } from "../assets/trailerdata";
import { Clapperboard } from "lucide-react";

const Trailers = () => {
  return (
    <div className={trailersStyles.container}>
      <main className={trailersStyles.main}>
        <div className={trailersStyles.layout}>
          {/* Left side */}
          <div className={trailersStyles.leftSide}>
            <div className={trailersStyles.leftCard}>
              <h2
                className={trailersStyles.leftTitle}
                style={{ fontFamily: "Monoton, cursive" }}
              >
                <Clapperboard className={trailersStyles.titleIcon} />
                Latest Trailers
              </h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Trailers;
