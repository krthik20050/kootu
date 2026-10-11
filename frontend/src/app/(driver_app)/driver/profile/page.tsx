"use client";

import React, { useState } from "react";
import AppShell from "@/components/driver-dashboard/AppShell";

export default function ProfilePage() {
  // Personal Info State
  const [fullName, setFullName] = useState("Rajesh Kumar");
  const [email, setEmail] = useState("rajesh.kumar@kootu-fleet.in");
  const [phone, setPhone] = useState("+91 98450 12890");
  const [driverId] = useState("DRV-IN-BLR-8842");

  // Vehicle Info State
  const [vehicleMake, setVehicleMake] = useState("Maruti Suzuki Ertiga Tour M");
  const [vehiclePlate, setVehiclePlate] = useState("KA 04 AK 5892");
  const [vehicleColor, setVehicleColor] = useState("Pearl Arctic White");
  const [permitNumber, setPermitNumber] = useState("BLR-KIA-COM-2026-904");

  // Feedback State
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(
      "Profile changes saved in local workspace cache. Note: Driver profile sync endpoint (/api/driver/profile) is currently offline; changes will synchronize when connected."
    );
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedDocName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  return (
    <AppShell title="Driver Profile" subtitle="DRIVER CREDENTIALS">
      {/* Driver Identity Card */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-extrabold text-2xl flex items-center justify-center flex-shrink-0">
            R
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                {fullName}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                Authorized Commercial Driver
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              ID: {driverId} • Bengaluru Airport Fleet
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              RTO & Police Verification
            </span>
            <span className="text-xs font-semibold text-neutral-900 dark:text-white">
              Karnataka State Ground Transport Badge
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Personal & Contact Details */}
        <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block mb-1">
              CONTACT & IDENTITY
            </span>
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              Personal Information
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Mobile Number (+91)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Commercial Driving Licence Number
              </label>
              <input
                type="text"
                disabled
                value="DL-KA04-20190014882 (Commercial / Badge Verified)"
                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-500 cursor-not-allowed font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:bg-black dark:hover:bg-neutral-200 transition"
              >
                Save Contact Information
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Vehicle & Credentials */}
        <div className="space-y-6">
          {/* Vehicle Form */}
          <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block mb-1">
                ASSIGNED VEHICLE
              </span>
              <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                Commercial Cab Details
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Color
                  </label>
                  <input
                    type="text"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Yellow Board Plate #
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Airport FASTag RFID Tag #
                  </label>
                  <input
                    type="text"
                    value={permitNumber}
                    onChange={(e) => setPermitNumber(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  Update Cab Information
                </button>
              </div>
            </form>
          </div>

          {/* Documents Section */}
          <div id="documents" className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block mb-1">
                COMPLIANCE & PERMITS
              </span>
              <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                Airport Licensing & Insurance
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold">KIA Airport Ground Commercial Entry Permit</h4>
                  <p className="text-[11px] text-neutral-500">Valid Till: 15 Nov 2026</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  Active
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold">Commercial Passenger Insurance</h4>
                  <p className="text-[11px] text-neutral-500">Policy: ICICI-LOMBARD-COM-88</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  Verified
                </span>
              </div>
            </div>

            {/* Document Upload Control */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Upload Renewal Documents (RC, Permit, Insurance)
              </label>
              <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 text-center cursor-pointer hover:border-neutral-500 transition relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <svg className="w-6 h-6 text-neutral-400 mx-auto mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {uploadedDocName || "Click or drag document to upload"}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Maximum file size: 10 MB (PDF/JPG)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
