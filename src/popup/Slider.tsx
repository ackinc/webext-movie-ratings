import { useEffect, useState, useRef } from "preact/hooks";
import {
  create as createSlider,
  type target as TargetElement,
  type Options as SliderOptions,
} from "nouislider";
import "nouislider/dist/nouislider.css";

export default function Slider({
  className,
  range,
  start,
  step,
  onInput,
}: SliderProps) {
  const [sliderCreated, setSliderCreated] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current!;
    createSlider(slider, {
      start,
      range,
      ...(step !== undefined ? { step } : {}),
      connect: true,
      behaviour: "tap-drag",
    });
    setSliderCreated(true);
  }, []);

  // update the nouislider's 'update' event listener whenever the onInput prop
  //   changes; fixes https://github.com/ackinc/webext-movie-ratings/issues/3
  useEffect(() => {
    if (!sliderCreated) return;

    const slider = sliderRef.current! as TargetElement;
    slider.noUiSlider!.off("update");
    // WARNING: nouislider triggers the 'update' event as many times during
    //   initial setup of this component as there are handles on the slider,
    //   even though these are not 'true updates'
    slider.noUiSlider!.on("update", (values) => onInput(values.map(Number)));
  }, [sliderCreated, onInput]);

  return (
    <div ref={sliderRef} className={`double-ended-slider ${className ?? ""}`} />
  );
}

interface SliderProps {
  className?: string;
  range: SliderOptions["range"];
  start: number[];
  step?: number;
  onInput: (values: number[]) => unknown;
}
