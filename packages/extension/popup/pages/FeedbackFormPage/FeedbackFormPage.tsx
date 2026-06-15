import { useState } from "preact/hooks";
import Button from "@common/components/Buttons/Button";
import * as siftApiService from "@common/siftApiService";
import TextInput from "@common/components/Inputs/TextInput/TextInput";
import "./FeedbackFormPage.css";

export default function FeedbackFormPage() {
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");

  const [submitState, setSubmitState] = useState<
    "filling" | "submitting" | "error" | "submitted"
  >("filling");

  return (
    <div className="feedback-form-page">
      <form className="feedback-form" onSubmit={handleSubmit}>
        <textarea
          name="details"
          placeholder="What would you like us to know?"
          onChange={(e) => {
            setSubmitState("filling");
            setDetails((e.target as HTMLTextAreaElement).value);
          }}
        >
          {details}
        </textarea>

        <TextInput
          name="email"
          type="email"
          value={email}
          onChange={(value: string) => {
            setSubmitState("filling");
            setEmail(value);
          }}
          autocomplete="email"
          placeholder="Email"
          helperText="Optional; do provide your email if you would like a response."
        />

        <Button variant="primary" type="submit" disabled={!details}>
          Send
        </Button>

        {submitState === "error" ? (
          <p className="error">Something went wrong. Please try again.</p>
        ) : submitState === "submitted" ? (
          <p className="success">Thank you! We'll take a look ASAP.</p>
        ) : null}
      </form>
    </div>
  );

  async function handleSubmit(e: Event) {
    e.preventDefault();

    setSubmitState("submitting");

    try {
      await siftApiService.sendUserFeedback(details, email);
      setSubmitState("submitted");
    } catch (e) {
      setSubmitState("error");
      throw e;
    }
  }
}
