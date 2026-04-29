import { useEffect } from "react";
import EquipmentArea, { type EquipmentAreaProps } from "./EquipmentArea";

export default function DesktopEquipmentArea(props: EquipmentAreaProps) {
  useEffect(() => {
    window.requestAnimationFrame(() => window.__chemoraHideLoadingScreen?.());
  }, []);

  return <EquipmentArea {...props} />;
}
