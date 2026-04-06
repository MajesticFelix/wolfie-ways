"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { memo } from "react";
import type { UserLocation } from "@/lib/hooks/use-user-location";

interface UserLocationMarkerProps {
  position: UserLocation;
  heading: number | null;
}

export const UserLocationMarker = memo(function UserLocationMarker({
  position,
  heading,
}: UserLocationMarkerProps) {
  return (
    <AdvancedMarker position={position} zIndex={15} title="Your location">
      <UserLocationDot heading={heading} />
    </AdvancedMarker>
  );
});

const CONE_SIZE = 56; // px — total width/height of the cone SVG
const DOT_SIZE = 16; // px — core blue dot diameter
const GLOW_SIZE = 40; // px — outer glow diameter
const CONTAINER = Math.max(CONE_SIZE, GLOW_SIZE); // square container to hold both

function UserLocationDot({ heading }: { heading: number | null }) {
  return (
    // AdvancedMarker anchors at center-bottom of the content element.
    // translateY(50%) shifts the element down by half its height so the
    // visual center of the container (where the dot lives) lands on the
    // map coordinate instead of the bottom edge.
    <div
      style={{
        position: "relative",
        width: CONTAINER,
        height: CONTAINER,
        transform: "translateY(50%)",
      }}
    >
      {/* Heading cone — rendered behind dot, hidden when heading unknown */}
      {heading !== null && (
        <svg
          width={CONE_SIZE}
          height={CONE_SIZE}
          viewBox={`0 0 ${CONE_SIZE} ${CONE_SIZE}`}
          style={{
            position: "absolute",
            // Centre the cone SVG inside the container
            top: (CONTAINER - CONE_SIZE) / 2,
            left: (CONTAINER - CONE_SIZE) / 2,
            pointerEvents: "none",
            // Rotate around the centre of the SVG (which sits on the dot centre)
            transformOrigin: `${CONE_SIZE / 2}px ${CONE_SIZE / 2}px`,
            transform: `rotate(${heading}deg)`,
            transition: "transform 300ms ease-out",
          }}
        >
          {/*
           * Cone: apex at the dot centre (28,28), spreading upward.
           * ~70° arc using a path: move to centre, line to top-left arc edge,
           * arc to top-right edge, close.
           */}
          <path
            d={conePathD(CONE_SIZE / 2, CONE_SIZE / 2, CONE_SIZE / 2 - 2, 70)}
            fill="rgba(66,133,244,0.35)"
          />
        </svg>
      )}

      {/* Outer accuracy glow */}
      <div
        style={{
          position: "absolute",
          top: (CONTAINER - GLOW_SIZE) / 2,
          left: (CONTAINER - GLOW_SIZE) / 2,
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          borderRadius: "50%",
          background: "rgba(66,133,244,0.15)",
          pointerEvents: "none",
        }}
      />

      {/* Core blue dot */}
      <div
        style={{
          position: "absolute",
          top: (CONTAINER - DOT_SIZE) / 2,
          left: (CONTAINER - DOT_SIZE) / 2,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: "50%",
          background: "#4285F4",
          border: "2.5px solid #ffffff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/**
 * Builds an SVG path for a cone (filled wedge) pointing upward.
 * @param cx  - centre x (apex of cone)
 * @param cy  - centre y (apex of cone)
 * @param r   - cone radius
 * @param angleDeg - total arc angle in degrees
 */
function conePathD(cx: number, cy: number, r: number, angleDeg: number): string {
  const half = (angleDeg / 2) * (Math.PI / 180);
  // Pointing upward: start angle = -π/2 (12 o'clock)
  const baseAngle = -Math.PI / 2;
  const x1 = cx + r * Math.cos(baseAngle - half);
  const y1 = cy + r * Math.sin(baseAngle - half);
  const x2 = cx + r * Math.cos(baseAngle + half);
  const y2 = cy + r * Math.sin(baseAngle + half);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}
