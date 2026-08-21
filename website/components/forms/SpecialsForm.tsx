"use client";

import { FormEvent, useState } from "react";
import { submitLead } from "@/lib/submitLead";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";

export default function SpecialsForm() {
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
        message: "Interested in current specials",
        source: "Specials Interest Form",
        treatmentInterest: "Specials"
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
      <p className="specials-form-success mt-[30px] mb-0 mx-auto max-w-[650px] text-center text-[length:16px] leading-[1.55] font-normal">
        Thank you! A member of our team will follow up with you shortly.
      </p>
    );
  }

  return (
    <form
      className="specials-form grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[16px] mt-[30px] [&_label]:grid [&_label]:gap-[7px] [&_span]:text-[length:13px] [&_span]:font-bold [&_input]:h-[46px] [&_input]:w-full [&_input]:rounded-[4px] [&_input]:border [&_input]:border-[#d0d0d0] [&_input]:bg-[#fff] [&_input]:px-[14px] [&_input]:text-[length:15px] [&_input]:outline-0 max-[640px]:grid-cols-[1fr]"
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
        <div className="specials-phone-input grid grid-cols-[82px_1fr] gap-[8px] [&_select]:h-[46px] [&_select]:rounded-[4px] [&_select]:border [&_select]:border-[#d0d0d0] [&_select]:bg-[#fff] [&_select]:px-[10px] [&_select]:outline-0">
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
      {emailError ? <p className="specials-form-error col-[1_/_-1] m-0 text-[#c0392b] text-[length:13px] leading-[1.45]">{emailError}</p> : null}
      {status === "error" ? (
        <p className="specials-form-error col-[1_/_-1] m-0 text-[#c0392b] text-[length:13px] leading-[1.45]">
          Something went wrong. Please try again or call us at (941) 923-8990.
        </p>
      ) : null}
      <p className="specials-disclaimer col-[1_/_-1] m-0 text-[#555] text-[length:12px] leading-[1.45]">
        Harmony Med Spa - By providing your phone number, you agree to receive promotional and marketing messages, notifications, and customer service communications from Harmony Med Spa. Message and data rates may apply. Consent is not a condition of purchase. Message frequency varies. Text HELP for help. Text STOP to cancel. <a href="#">See terms</a>, <a href="#">See Privacy Policy</a>.
      </p>
      <button
        className="col-[1_/_-1] justify-self-center min-w-[150px] py-[14px] px-[24px] border-0 border-t border-b border-[#d49d19] bg-[transparent] text-[#000] text-[length:16px] cursor-pointer max-[640px]:w-full"
        type="submit"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
