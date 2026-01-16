import { useEffect, useRef } from "preact/hooks";
import {
  create as createSlider,
  type target as TargetElement,
} from "nouislider";
import "nouislider/dist/nouislider.css";

import type { NumberRange } from "../common";

export default function DoubleEndedSlider(props: DoubleEndedSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current as TargetElement;

    createSlider(slider, {
      start: [props.defaultValues.min, props.defaultValues.max],
      range: props.range,
      step: props.step,
      connect: true,
      behaviour: "tap-drag",
    });

    slider.noUiSlider!.on("update", (values) => {
      props.onInput({ min: Number(values[0]), max: Number(values[1]) });
    });
  }, []);

  return (
    <div
      ref={sliderRef}
      className={`double-ended-slider ${props.className ?? ""}`}
    />
  );
}

interface DoubleEndedSliderProps {
  className?: string;
  defaultValues: NumberRange;
  range: NumberRange;
  step: number;
  onInput: (values: NumberRange) => unknown;
}
