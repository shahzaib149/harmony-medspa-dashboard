"use client";

import { FormEvent, useState } from "react";
import { submitLead } from "@/lib/submitLead";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailError, setEmailError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError("");
    setStatus("submitting");

    try {
      await submitLead({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email,
        phone,
        message: "Newsletter opt-in",
        source: "Newsletter Signup Form",
        treatmentInterest: "Newsletter"
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="learn-more-success w-[min(320px,100%)] mt-[23px] mb-0 mx-auto text-center text-[length:15px] leading-[1.45] font-normal">
        Thank you! You&apos;re on the list — check your inbox for your $50 offer.
      </p>
    );
  }

  return (
    <form
      className="learn-more-form grid gap-[21px] w-[min(320px,100%)] mt-[23px] mb-0 mx-auto [&_label]:grid [&_label]:gap-[8px] [&_label]:text-[length:14px] [&_label]:font-bold [&_input]:h-[33px] [&_input]:[border:1px_solid_#c9c9c9] [&_input]:bg-[#fff] [&_input]:text-[#333] [&_input]:[font:inherit] [&_input]:text-[length:14px]! [&_select]:h-[33px] [&_select]:[border:1px_solid_#c9c9c9] [&_select]:bg-[#fff] [&_select]:text-[#333] [&_select]:[font:inherit] [&_select]:text-[length:14px]! [&_input]:w-full [&_input]:py-0 [&_input]:px-[9px] [&_p]:mt-[-13px] [&_p]:mb-0 [&_p]:mx-0 [&_p]:text-[#566274] [&_p]:text-[length:10px] [&_p]:leading-[1.35] [&_p_a]:text-[#008ad8] [&_p_a]:underline [&_button]:min-h-[48px] [&_button]:mt-[1px] [&_button]:border-0 [&_button]:rounded-[14px] [&_button]:bg-[#242424] [&_button]:text-[#fff] [&_button]:[font:inherit] [&_button]:text-[length:16px]! [&_button]:font-normal! [&_button]:cursor-pointer"
      onSubmit={handleSubmit}
      noValidate
    >
      <label>
        <span>First Name</span>
        <input type="text" name="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
      </label>
      <label>
        <span>Last Name</span>
        <input type="text" name="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} />
      </label>
      <label>
        <span>Email Address</span>
        <input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        <span>SMS Phone Number</span>
        <div className="learn-more-phone-input grid grid-cols-[55px_1fr] [&_select]:[border-right:0] [&_select]:pl-[8px]">
          <select name="country" aria-label="Country code" defaultValue="US">
            <option value="US">US</option>
          </select>
          <input
            type="tel"
            name="phone"
            placeholder="+1"
            aria-label="SMS phone number"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      </label>
      {emailError ? <p className="learn-more-error text-[#c0392b]! text-[length:12px]!">{emailError}</p> : null}
      {status === "error" ? (
        <p className="learn-more-error text-[#c0392b]! text-[length:12px]!">Something went wrong. Please try again or call us at (941) 923-8990.</p>
      ) : null}
      <p>
        Harmony Med Spa - By providing your phone number, you agree to receive promotional and marketing messages, notifications, and customer service communications from Harmony Med Spa. Message and data rates may apply. Consent is not a condition of purchase. Message frequency varies. Text HELP for help. Text STOP to cancel. <a href="#">See terms</a>, <a href="#">See Privacy Policy</a>.
      </p>
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Joining..." : "Join our Newsletter"}
      </button>
    </form>
  );
}
