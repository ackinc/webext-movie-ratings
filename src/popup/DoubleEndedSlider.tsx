import { useEffect, useState, useRef } from "preact/hooks";
import {
  create as createSlider,
  type target as TargetElement,
  type Options as SliderOptions,
} from "nouislider";
import "nouislider/dist/nouislider.css";

import type { NumberRange } from "../common";

export default function DoubleEndedSlider({
  className,
  defaultValues,
  range,
  step,
  onInput,
}: DoubleEndedSliderProps) {
  const [sliderCreated, setSliderCreated] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current!;
    createSlider(slider, {
      start: [defaultValues.min, defaultValues.max],
      range,
      step,
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
    slider.noUiSlider!.on("update", (values) => {
      onInput({ min: Number(values[0]), max: Number(values[1]) });
    });
  }, [sliderCreated, onInput]);

  return (
    <div ref={sliderRef} className={`double-ended-slider ${className ?? ""}`} />
  );
}

interface DoubleEndedSliderProps {
  className?: string;
  defaultValues: NumberRange;
  range: SliderOptions["range"];
  step: number;
  onInput: (values: NumberRange) => unknown;
}
