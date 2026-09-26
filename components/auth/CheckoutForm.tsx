"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronRight, ArrowLeft, Upload, AlertTriangle, Loader2, CheckCircle2, XCircle, ShieldCheck, Download, ExternalLink, RefreshCw } from "lucide-react";

type StepId = "select" | "forms" | "review" | "payment";

const STEPS: { id: StepId; name: string }[] = [
  { id: "select", name: "Select Events" },
  { id: "forms", name: "Your Details" },
  { id: "review", name: "Review" },
  { id: "payment", name: "Payment" },
];

const EVENTS = [
  { id: "visitor", title: "Visitor Pass", price: 69, isTeam: false, type: "visitor" },
  { id: "panache", title: "Panache", price: 2999, isTeam: true, type: "generic" },
  { id: "dance_battle", title: "Dance Battle", price: 2499, isTeam: true, type: "generic" },
  { id: "bandjam", title: "BANDJAM", price: 1499, isTeam: true, type: "generic" },
  { id: "bgmi", title: "BGMI TOURNAMENT", price: 499, isTeam: true, type: "bgmi" },
  { id: "valorant", title: "VALORANT TOURNAMENT", price: 499, isTeam: true, type: "valorant" },
  { id: "freefire", title: "FREE FIRE TOURNAMENT", price: 499, isTeam: true, type: "freefire" },
  { id: "versevaad", title: "VERSEVAAD", price: 499, isTeam: false, type: "generic" },
  { id: "focus", title: "FOCUS", price: 499, isTeam: false, type: "generic" },
  { id: "dumb_show", title: "DUMB SHOW", price: 499, isTeam: true, type: "generic" },
  { id: "clay_modelling", title: "CLAY MODELLING", price: 499, isTeam: false, type: "generic" },
  { id: "echoes_of_noor", title: "ECHOES OF NOOR", price: 499, isTeam: true, type: "generic" },
  { id: "bidding", title: "BIDDING BEFORE WICKET", price: 1499, isTeam: true, type: "generic" },
  { id: "courtroom", title: "COURTROOM", price: 1499, isTeam: true, type: "generic" },
  { id: "art_relay", title: "ART RELAY", price: 1499, isTeam: true, type: "generic" },
];

type TeamMember = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  gender: string;
  age: string;
  institutionName: string;
  referralCode: string;
  address: string;
  idCard: File | null;
};

export default function CheckoutForm() {
  const [currentStep, setCurrentStep] = useState<StepId>("select");
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  
  // Dynamic form state. Keys are like "generic_name", "bgmi_email", etc.
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Dynamic team members state. Key is the group (e.g., 'bgmi', 'generic')
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  
  // ID Cards
  const [idCards, setIdCards] = useState<Record<string, File | null>>({});

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // Cashfree Payment states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verifiedOrder, setVerifiedOrder] = useState<{ orderId: string; registrationId: string; email?: string } | null>(null);

  const verifyOrderPayment = useCallback(async (orderId: string) => {
    setVerificationStatus("verifying");
    setPaymentError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_PAYMENT",
          orderId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerificationStatus("success");
        setVerifiedOrder({
          orderId,
          registrationId: data.id,
          email: data.email,
        });
      } else {
        setVerificationStatus("error");
        setPaymentError(data.error || "Payment verification failed or was cancelled.");
      }
    } catch (err: any) {
      setVerificationStatus("error");
      setPaymentError(err.message || "Failed to verify payment with server.");
    }
  }, []);

  // Listen for order_id in URL search parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (orderId) {
      setCurrentStep("payment");
      verifyOrderPayment(orderId);
    }
  }, [verifyOrderPayment]);

  const handleCashfreePayment = async () => {
    if (isProcessingPayment) return;
    setPaymentError(null);

    if (selectedEvents.length === 0) {
      setPaymentError("Please select at least one event or pass.");
      return;
    }

    if (isNextDisabled()) {
      setPaymentError("Please complete all required fields across your selected event categories.");
      setCurrentStep("forms");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const activeGroups = getActiveGroups();
      const primaryGroup = activeGroups[0] || "visitor";

      const name = getField(primaryGroup, "name");
      const email = getField(primaryGroup, "email");
      const mobile = getField(primaryGroup, "mobileNumber");
      const gender = getField(primaryGroup, "gender");
      const institutionName = getField(primaryGroup, "institutionName");
      const address = getField(primaryGroup, "address");
      const rawRef = getField(primaryGroup, "referralCode");
      const referralCode = rawRef && rawRef.trim() ? rawRef.trim().toUpperCase() : "2024BTECH014";

      const regNum = getField(primaryGroup, "registrationNumber") || getField(primaryGroup, "rollNumber") || `REG_${Date.now()}`;

      const payload = {
        action: "CREATE_ORDER",
        ...formData,
        name,
        email,
        mobile,
        phone: mobile,
        gender,
        institutionName,
        address,
        registrationNumber: regNum,
        rollNumber: regNum,
        referralCode,
        referredByCode: referralCode,
        coupon: promoApplied ? promoCode.trim().toUpperCase() : "",
        selectedEvents,
        teamMembers,
        amount: calculateTotal(),
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to initialize payment session with server.");
      }

      // If mock mode (e.g. Free pass / 100% coupon discount)
      if (data.is_mock) {
        await verifyOrderPayment(data.order_id);
        setIsProcessingPayment(false);
        return;
      }

      if (!data.payment_session_id) {
        throw new Error("Cashfree session ID missing from order creation response.");
      }

      // Load Cashfree JS SDK v3 dynamically
      const loadCashfreeSdk = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if ((window as any).Cashfree) {
            resolve((window as any).Cashfree);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
          script.async = true;
          script.onload = () => resolve((window as any).Cashfree);
          script.onerror = () => reject(new Error("Unable to load Cashfree Payment SDK. Please check your network connection."));
          document.body.appendChild(script);
        });
      };

      const CashfreeSDK = await loadCashfreeSdk();
      const isProduction = process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION";
      const cashfree = CashfreeSDK({
        mode: isProduction ? "production" : "sandbox",
      });

      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentError(err.message || "An unexpected error occurred while initiating payment.");
      setIsProcessingPayment(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
      if (formContainerRef.current) {
        formContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
      if (formContainerRef.current) {
        formContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    const total = selectedEvents.reduce((acc, eventId) => {
      const ev = EVENTS.find((e) => e.id === eventId);
      return acc + (ev ? ev.price : 0);
    }, 0);
    
    if (promoApplied && total > 0) {
      return Math.max(0, total - 100);
    }
    return total;
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const updateField = (group: string, field: string, value: string) => {
    const finalValue = field === 'referralCode' ? value.toUpperCase() : value;
    setFormData((prev) => {
      const newData = { ...prev, [`${group}_${field}`]: finalValue };
      
      // Auto-sync personal details across groups for better UX
      const personalFields = ['name', 'email', 'mobileNumber', 'gender', 'age', 'institutionName', 'address', 'referralCode'];
      if (personalFields.includes(field)) {
        // Sync to all other active groups
        const activeGroups = getActiveGroups();
        activeGroups.forEach(g => {
          if (g !== group) {
            newData[`${g}_${field}`] = finalValue;
          }
        });
      }
      return newData;
    });
  };

  const getField = (group: string, field: string) => {
    return formData[`${group}_${field}`] || "";
  };

  const getActiveGroups = () => {
    const groups = new Set<string>();
    selectedEvents.forEach(id => {
      const ev = EVENTS.find(e => e.id === id);
      if (ev) {
        groups.add(ev.type); // "generic", "bgmi", "valorant", "freefire", "visitor"
      }
    });
    return Array.from(groups);
  };

  // Team Member Management
  const addTeamMember = (group: string) => {
    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      email: "",
      mobileNumber: "",
      gender: "",
      age: "",
      institutionName: getField(group, 'institutionName'), // copy from leader by default
      referralCode: getField(group, 'referralCode').toUpperCase(),
      address: getField(group, 'address'),
      idCard: null,
    };
    
    setTeamMembers(prev => ({
      ...prev,
      [group]: [...(prev[group] || []), newMember]
    }));
  };

  const removeTeamMember = (group: string, memberId: string) => {
    setTeamMembers(prev => ({
      ...prev,
      [group]: (prev[group] || []).filter(m => m.id !== memberId)
    }));
  };

  const updateTeamMember = (group: string, memberId: string, field: keyof TeamMember, value: any) => {
    setTeamMembers(prev => ({
      ...prev,
      [group]: (prev[group] || []).map(m => m.id === memberId ? { ...m, [field]: value } : m)
    }));
  };

  const getTeamRequirements = (group: string) => {
    if (group === 'bgmi') return { min: 4, max: 5 };
    if (group === 'valorant') return { min: 5, max: 6 };
    if (group === 'freefire') return { min: 4, max: 5 };
    return { min: 2, max: 15 };
  };

  // Ensure all required fields are filled for active groups
  const isNextDisabled = () => {
    if (currentStep === "select") {
      return selectedEvents.length === 0;
    }
    if (currentStep === "forms") {
      const activeGroups = getActiveGroups();
      
      for (const group of activeGroups) {
        // Basic personal details
        const name = getField(group, 'name').trim();
        const email = getField(group, 'email').trim();
        const mobile = getField(group, 'mobileNumber').trim();
        const gender = getField(group, 'gender');
        const inst = getField(group, 'institutionName').trim();
        const address = getField(group, 'address').trim();
        const idCard = idCards[group];
        
        // ALL groups (including visitor) now require all these details
        if (!name || !isValidEmail(email) || !isValidPhone(mobile) || !gender || !inst || !address) return true;

        // Specific fields
        if (group === 'bgmi') {
          if (!getField(group, 'teamName').trim() || !getField(group, 'leaderIgn').trim() || !getField(group, 'leaderUid').trim()) return true;
        }
        if (group === 'valorant') {
          if (!getField(group, 'teamName').trim() || !getField(group, 'leaderRiotId').trim()) return true;
        }
        if (group === 'freefire') {
          if (!getField(group, 'teamName').trim() || !getField(group, 'leaderUid').trim()) return true;
        }
        // Generic team fields
        if (group === 'generic') {
          const hasTeamEvents = selectedEvents.map(id => EVENTS.find(e => e.id === id)).some(e => e?.type === 'generic' && e?.isTeam);
          if (hasTeamEvents && !getField(group, 'teamName').trim()) return true;
        }

        // Team members validation
        const hasTeamEvents = selectedEvents.map(id => EVENTS.find(e => e.id === id)).some(e => e?.type === group && e?.isTeam);
        if (hasTeamEvents) {
          const members = teamMembers[group] || [];
          const req = getTeamRequirements(group);
          const totalMembers = 1 + members.length; // leader + members
          
          if (totalMembers < req.min) return true;
          
          for (const m of members) {
            if (!m.name.trim() || !isValidEmail(m.email) || !isValidPhone(m.mobileNumber) || !m.gender || !m.institutionName.trim() || !m.address.trim()) {
              return true;
            }
          }
        }
      }
      
      return false; // All active groups are valid
    }
    return false;
  };

  const renderPersonalFields = (group: string, title: string, showTeamFields: boolean, specificFields?: React.ReactNode) => {
    const members = teamMembers[group] || [];
    const req = getTeamRequirements(group);
    const totalMembers = 1 + members.length;
    const needsMore = totalMembers < req.min;

    return (
      <div key={group} className="space-y-6 bg-white/5 p-6 rounded-xl border border-white/10 mt-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 opacity-50"></div>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold uppercase tracking-wider text-white/90">
            {title}
          </h3>
        </div>
        
        {/* Specific Fields Rendered at top like in old site */}
        {specificFields && (
          <div className="space-y-4 mb-8">
            {specificFields}
          </div>
        )}
        
        {showTeamFields && !specificFields && (
          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
                <span>Team / Squad Name <span className="text-violet-400">*</span></span>
              </label>
              <input
                type="text"
                value={getField(group, 'teamName')}
                onBlur={() => handleBlur(`${group}_teamName`)}
                onChange={(e) => updateField(group, 'teamName', e.target.value)}
                className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-all ${
                  touched[`${group}_teamName`] && !getField(group, 'teamName').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
                }`}
                placeholder="Enter Team Name"
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
              <span>Name <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="text"
              value={getField(group, 'name')}
              onBlur={() => handleBlur(`${group}_name`)}
              onChange={(e) => updateField(group, 'name', e.target.value)}
              className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-all ${
                touched[`${group}_name`] && !getField(group, 'name').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
              <span>Email <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="email"
              value={getField(group, 'email')}
              onBlur={() => handleBlur(`${group}_email`)}
              onChange={(e) => updateField(group, 'email', e.target.value)}
              className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-all ${
                touched[`${group}_email`] && !isValidEmail(getField(group, 'email')) ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
              <span>Mobile Number <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="tel"
              value={getField(group, 'mobileNumber')}
              onBlur={() => handleBlur(`${group}_mobileNumber`)}
              onChange={(e) => updateField(group, 'mobileNumber', e.target.value)}
              className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-all ${
                touched[`${group}_mobileNumber`] && !isValidPhone(getField(group, 'mobileNumber')) ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="10-digit number"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
              <span>Gender <span className="text-violet-400">*</span></span>
            </label>
            <select
              value={getField(group, 'gender')}
              onBlur={() => handleBlur(`${group}_gender`)}
              onChange={(e) => updateField(group, 'gender', e.target.value)}
              className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all appearance-none ${
                touched[`${group}_gender`] && !getField(group, 'gender') ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
            >
              <option value="" className="bg-[#020202]">Select Gender</option>
              <option value="male" className="bg-[#020202]">Male</option>
              <option value="female" className="bg-[#020202]">Female</option>
              <option value="other" className="bg-[#020202]">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
              <span>Age <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="number"
              value={getField(group, 'age')}
              onBlur={() => handleBlur(`${group}_age`)}
              onChange={(e) => updateField(group, 'age', e.target.value)}
              className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-all ${
                touched[`${group}_age`] && !getField(group, 'age') ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="e.g., 20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
              <span>Institution Name <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="text"
              value={getField(group, 'institutionName')}
              onBlur={() => handleBlur(`${group}_institutionName`)}
              onChange={(e) => updateField(group, 'institutionName', e.target.value)}
              className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-all ${
                touched[`${group}_institutionName`] && !getField(group, 'institutionName').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="Your school/college/university"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
              <span>Referral Code <span className="text-white/40">(Optional)</span></span>
            </label>
            <input
              type="text"
              value={getField(group, 'referralCode')}
              onChange={(e) => updateField(group, 'referralCode', e.target.value.toUpperCase())}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-all uppercase"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
              <span>Institution Identity Card <span className="text-violet-400">*</span></span>
            </label>
            <div className="relative">
              <input
                type="file"
                id={`file_${group}`}
                accept="image/png, image/jpeg, image/jpg, application/pdf"
                onChange={(e) => setIdCards(prev => ({ ...prev, [group]: e.target.files?.[0] || null }))}
                className="hidden"
              />
              <label
                htmlFor={`file_${group}`}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {idCards[group] ? idCards[group]?.name : "Choose file"}
              </label>
            </div>
            <p className="text-[10px] text-white/40 font-mono">Max size: 500KB</p>
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
            <span>Address <span className="text-violet-400">*</span></span>
          </label>
          <textarea
            value={getField(group, 'address')}
            onBlur={() => handleBlur(`${group}_address`)}
            onChange={(e) => updateField(group, 'address', e.target.value)}
            rows={2}
            className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-all resize-none ${
              touched[`${group}_address`] && !getField(group, 'address').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
            }`}
            placeholder="Enter your full address"
          />
        </div>

        {/* Dynamic Team Members Section */}
        {showTeamFields && (
          <div className="pt-8 mt-8 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-[#22d3ee]">Team Members</h4>
              {totalMembers < req.max && (
                <button
                  type="button"
                  onClick={() => addTeamMember(group)}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-sm transition-all"
                >
                  + Add Team Member
                </button>
              )}
            </div>
            
            <div className={`p-4 rounded-lg mb-6 border ${needsMore ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <p className="text-sm text-white/90">
                Team size requirement: {req.min} - {req.max} members<br/>
                Current: <strong className={needsMore ? 'text-red-400' : 'text-green-400'}>{totalMembers}</strong> (including leader)
              </p>
              {needsMore && (
                <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> You need to add {req.min - totalMembers} more team member(s)
                </p>
              )}
            </div>

            <div className="space-y-8">
              {members.map((member, index) => (
                <div key={member.id} className="relative pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-bold text-white/80">Team Member #{index + 2}</h5>
                    <button
                      type="button"
                      onClick={() => removeTeamMember(group, member.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-white/60 uppercase tracking-widest">Name <span className="text-violet-400">*</span></label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateTeamMember(group, member.id, 'name', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-white/60 uppercase tracking-widest">Email <span className="text-violet-400">*</span></label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateTeamMember(group, member.id, 'email', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-white/60 uppercase tracking-widest">Mobile Number <span className="text-violet-400">*</span></label>
                      <input
                        type="tel"
                        value={member.mobileNumber}
                        onChange={(e) => updateTeamMember(group, member.id, 'mobileNumber', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="10-digit number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-white/60 uppercase tracking-widest">Gender <span className="text-violet-400">*</span></label>
                      <select
                        value={member.gender}
                        onChange={(e) => updateTeamMember(group, member.id, 'gender', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 appearance-none"
                      >
                        <option value="" className="bg-[#020202]">Select Gender</option>
                        <option value="male" className="bg-[#020202]">Male</option>
                        <option value="female" className="bg-[#020202]">Female</option>
                        <option value="other" className="bg-[#020202]">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-white/60 uppercase tracking-widest">Age <span className="text-violet-400">*</span></label>
                      <input
                        type="number"
                        value={member.age}
                        onChange={(e) => updateTeamMember(group, member.id, 'age', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-white/60 uppercase tracking-widest">Institution Name <span className="text-violet-400">*</span></label>
                      <input
                        type="text"
                        value={member.institutionName}
                        onChange={(e) => updateTeamMember(group, member.id, 'institutionName', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="Your school/college"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-white/60 uppercase tracking-widest flex justify-between">
                        <span>Institution Identity Card <span className="text-violet-400">*</span></span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id={`file_${group}_${member.id}`}
                          accept="image/png, image/jpeg, image/jpg, application/pdf"
                          onChange={(e) => updateTeamMember(group, member.id, 'idCard', e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <label
                          htmlFor={`file_${group}_${member.id}`}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          {member.idCard ? member.idCard.name : "Choose file"}
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-6">
                    <label className="text-xs font-mono text-white/60 uppercase tracking-widest">Address <span className="text-violet-400">*</span></label>
                    <textarea
                      value={member.address}
                      onChange={(e) => updateTeamMember(group, member.id, 'address', e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 resize-none"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div ref={formContainerRef} className="w-full max-w-2xl mx-auto p-6 md:p-10 pb-24 md:pb-32 min-h-screen lg:min-h-0 flex flex-col justify-center animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600 uppercase tracking-tighter mb-2">
          CHECKOUT
        </h2>
        <p className="text-white/50 font-mono text-xs md:text-sm uppercase tracking-widest">
          Complete your registration for Sabrang 2026
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 z-0"></div>
        {STEPS.map((step, idx) => {
          const isActive = idx === stepIndex;
          const isCompleted = idx < stepIndex;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-[#020202] px-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] border-2 border-violet-400" 
                    : isCompleted
                      ? "bg-white/20 text-white border border-white/30"
                      : "bg-[#020202] text-white/40 border border-white/10"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-[10px] md:text-xs font-mono uppercase tracking-widest ${
                isActive ? "text-violet-400" : isCompleted ? "text-white/70" : "text-white/30"
              }`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="flex-grow">
        
        {/* STEP 1: SELECT EVENTS */}
        <div style={{ display: currentStep === "select" ? "block" : "none" }}>
          <div className="space-y-6">
            <h3 className="text-xl font-bold uppercase tracking-wider text-white/90 border-b border-white/10 pb-2">
              Choose Your Events
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {EVENTS.map((event) => {
                const isSelected = selectedEvents.includes(event.id);
                const isVisitor = event.id === "visitor";
                return (
                  <div 
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? isVisitor 
                          ? "bg-amber-900/30 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                          : "bg-violet-900/30 border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]" 
                        : isVisitor
                          ? "bg-amber-900/10 border-amber-500/40 hover:border-amber-400/70 hover:bg-amber-900/20"
                          : "bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`font-bold text-sm ${isVisitor && !isSelected ? "text-amber-100" : ""}`}>{event.title}</h4>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? isVisitor ? "bg-amber-500 border-amber-500" : "bg-violet-500 border-violet-500" 
                          : isVisitor ? "border-amber-500/40" : "border-white/30"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-black" />}
                      </div>
                    </div>
                    <p className={`font-mono text-xs ${isVisitor ? "text-amber-400" : "text-violet-400"}`}>₹ {event.price}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* STEP 2: YOUR DETAILS */}
        <div style={{ display: currentStep === "forms" ? "block" : "none" }}>
          <div className="space-y-6">
            
            {/* Generic Events Group */}
            {getActiveGroups().includes('generic') && renderPersonalFields('generic', `Registration for: ${
              selectedEvents
                .map(id => EVENTS.find(e => e.id === id))
                .filter(e => e?.type === 'generic')
                .map(e => e?.title)
                .join(', ')
            }`, selectedEvents.map(id => EVENTS.find(e => e.id === id)).some(e => e?.type === 'generic' && e?.isTeam))}

            {/* BGMI Group */}
            {getActiveGroups().includes('bgmi') && renderPersonalFields('bgmi', 'BGMI TOURNAMENT', true, (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    <span>Squad Name <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('bgmi', 'teamName')}
                    onBlur={() => handleBlur(`bgmi_teamName`)}
                    onChange={(e) => updateField('bgmi', 'teamName', e.target.value)}
                    className={`w-full bg-black/40 border rounded-lg px-4 py-2 text-white focus:outline-none ${touched[`bgmi_teamName`] && !getField('bgmi', 'teamName').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    <span>Leader In-Game Name <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('bgmi', 'leaderIgn')}
                    onBlur={() => handleBlur(`bgmi_leaderIgn`)}
                    onChange={(e) => updateField('bgmi', 'leaderIgn', e.target.value)}
                    className={`w-full bg-black/40 border rounded-lg px-4 py-2 text-white focus:outline-none ${touched[`bgmi_leaderIgn`] && !getField('bgmi', 'leaderIgn').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    <span>Leader UID <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('bgmi', 'leaderUid')}
                    onBlur={() => handleBlur(`bgmi_leaderUid`)}
                    onChange={(e) => updateField('bgmi', 'leaderUid', e.target.value)}
                    className={`w-full bg-black/40 border rounded-lg px-4 py-2 text-white focus:outline-none ${touched[`bgmi_leaderUid`] && !getField('bgmi', 'leaderUid').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
              </div>
            ))}

            {/* Valorant Group */}
            {getActiveGroups().includes('valorant') && renderPersonalFields('valorant', 'VALORANT TOURNAMENT', true, (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    <span>Team Name <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('valorant', 'teamName')}
                    onBlur={() => handleBlur(`valorant_teamName`)}
                    onChange={(e) => updateField('valorant', 'teamName', e.target.value)}
                    className={`w-full bg-black/40 border rounded-lg px-4 py-2 text-white focus:outline-none ${touched[`valorant_teamName`] && !getField('valorant', 'teamName').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    <span>Leader Riot ID <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('valorant', 'leaderRiotId')}
                    onBlur={() => handleBlur(`valorant_leaderRiotId`)}
                    onChange={(e) => updateField('valorant', 'leaderRiotId', e.target.value)}
                    className={`w-full bg-black/40 border rounded-lg px-4 py-2 text-white focus:outline-none ${touched[`valorant_leaderRiotId`] && !getField('valorant', 'leaderRiotId').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
              </div>
            ))}

            {/* Free Fire Group */}
            {getActiveGroups().includes('freefire') && renderPersonalFields('freefire', 'FREE FIRE TOURNAMENT', true, (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    <span>Team Name <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('freefire', 'teamName')}
                    onBlur={() => handleBlur(`freefire_teamName`)}
                    onChange={(e) => updateField('freefire', 'teamName', e.target.value)}
                    className={`w-full bg-black/40 border rounded-lg px-4 py-2 text-white focus:outline-none ${touched[`freefire_teamName`] && !getField('freefire', 'teamName').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/60 uppercase tracking-widest">
                    <span>Leader UID <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('freefire', 'leaderUid')}
                    onBlur={() => handleBlur(`freefire_leaderUid`)}
                    onChange={(e) => updateField('freefire', 'leaderUid', e.target.value)}
                    className={`w-full bg-black/40 border rounded-lg px-4 py-2 text-white focus:outline-none ${touched[`freefire_leaderUid`] && !getField('freefire', 'leaderUid').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
              </div>
            ))}

            {/* Visitor Pass Group */}
            {getActiveGroups().includes('visitor') && renderPersonalFields('visitor', 'Visitor Pass', false)}
            
          </div>
        </div>

        {/* STEP 3: REVIEW */}
        <div style={{ display: currentStep === "review" ? "block" : "none" }}>
          <div className="space-y-6">
            <h3 className="text-xl font-bold uppercase tracking-wider text-white/90 border-b border-white/10 pb-2">
              Review Your Order
            </h3>
            
            <div className="bg-white/5 border border-violet-500/30 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white/50 text-xs font-mono uppercase tracking-widest border-b border-white/10 pb-2">
                  <span>Selected Items</span>
                  <span>Price</span>
                </div>

                {selectedEvents.map((eventId) => {
                  const ev = EVENTS.find((e) => e.id === eventId);
                  return (
                    <div key={eventId} className="flex justify-between items-center text-white/90">
                      <span>{ev?.title}</span>
                      <span className="font-mono">₹ {ev?.price}</span>
                    </div>
                  );
                })}
                
                {selectedEvents.length === 0 && (
                  <div className="text-gray-500 italic text-sm">No events selected.</div>
                )}

                <div className="h-px w-full bg-white/10 my-4"></div>
                
                {/* Promo Code section */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-grow bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-all text-sm uppercase"
                  />
                  <button 
                    type="button"
                    onClick={() => setPromoApplied(promoCode.trim().length > 0)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all border border-white/10 hover:border-white/30"
                  >
                    Apply
                  </button>
                </div>

                {promoApplied && (
                  <div className="flex justify-between items-center text-green-400 text-sm">
                    <span>Discount:</span>
                    <span className="font-mono">- ₹ 100</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center font-black text-xl text-violet-400 pt-2 border-t border-white/10">
                  <span>Total Amount</span>
                  <span>₹ {calculateTotal()}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-white/40 font-mono">
              Please review your selections before proceeding to payment
            </p>
          </div>
        </div>

        {/* STEP 4: PAYMENT */}
        <div style={{ display: currentStep === "payment" ? "block" : "none" }}>
          {verificationStatus === "verifying" && (
            <div className="py-12 px-6 text-center space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">
                Verifying Payment
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Communicating securely with Cashfree payment gateway. Please keep this window open while we generate your registration pass.
              </p>
            </div>
          )}

          {verificationStatus === "success" && verifiedOrder && (
            <div className="py-8 px-6 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                  Registration Confirmed
                </h3>
                <p className="text-emerald-400 font-mono text-xs uppercase tracking-widest">
                  Payment Processed Successfully
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">Order ID:</span>
                  <span className="text-white font-medium">{verifiedOrder.orderId}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">Registration ID:</span>
                  <span className="text-violet-300 font-medium">{verifiedOrder.registrationId}</span>
                </div>
                {verifiedOrder.email && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Pass Delivered To:</span>
                    <span className="text-white/90">{verifiedOrder.email}</span>
                  </div>
                )}
              </div>

              <p className="text-white/60 text-xs leading-relaxed">
                Your official festival pass with verifiable QR code has been generated. You may download it below.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={`/api/receipt?id=${encodeURIComponent(verifiedOrder.registrationId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Pass (PDF)
                </a>
                <button
                  type="button"
                  onClick={() => { window.location.href = "/"; }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-bold text-sm text-white transition-all"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )}

          {verificationStatus === "error" && (
            <div className="py-8 px-6 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(244,63,94,0.3)]">
                <XCircle className="w-8 h-8 text-rose-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                  Payment Verification Issue
                </h3>
                <p className="text-rose-400/90 text-sm">
                  {paymentError || "The transaction could not be confirmed or was cancelled."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    const id = params.get("order_id");
                    if (id) {
                      verifyOrderPayment(id);
                    } else {
                      setVerificationStatus("idle");
                    }
                  }}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Verification
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationStatus("idle");
                    setPaymentError(null);
                    setCurrentStep("review");
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-bold text-sm text-white transition-all"
                >
                  Back to Review
                </button>
              </div>
            </div>
          )}

          {verificationStatus === "idle" && (
            <div className="space-y-6 text-center py-4">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white/90 border-b border-white/10 pb-2 mb-8">
                Payment Summary
              </h3>
              
              <div className="bg-[#260b3b]/30 border border-[#5e239d]/50 rounded-xl p-6 text-left mb-6 inline-block max-w-sm mx-auto w-full">
                <h4 className="font-bold text-violet-300 mb-2 uppercase text-sm tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Before proceeding:
                </h4>
                <ul className="text-white/70 text-sm space-y-2 list-disc list-inside">
                  <li>Ensure all personal details are accurate</li>
                  <li>Payment is processed securely by Cashfree</li>
                  <li>Do not refresh or close the page while processing</li>
                </ul>
              </div>

              {paymentError && (
                <div className="max-w-md mx-auto p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}
              
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCashfreePayment}
                  disabled={isProcessingPayment}
                  className="px-10 py-4 w-full md:w-auto bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.3)] mx-auto transition-all text-white cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting to Cashfree Gateway...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Pay ₹ {calculateTotal()} via Cashfree</span>
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-[11px] text-white/40 font-mono mt-4 uppercase tracking-widest">
                Secured by Cashfree Payments India 256-bit SSL • UPI, Cards, NetBanking
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="relative z-50 flex justify-between items-center mt-6 border-t border-white/10 pt-4 bg-[#020202]">
        <button
          type="button"
          onClick={handleBack}
          disabled={stepIndex === 0 || verificationStatus === "success" || verificationStatus === "verifying"}
          className={`relative z-50 px-6 py-3 rounded-lg transition-all flex items-center gap-2 text-sm font-bold ${
            stepIndex === 0 || verificationStatus === "success" || verificationStatus === "verifying"
              ? "opacity-0 pointer-events-none" 
              : "bg-white/5 border border-white/10 hover:border-violet-400/50 hover:bg-white/10 text-white cursor-pointer"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep !== "payment" && (
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled()}
            className="relative z-50 px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900/40 disabled:text-white/40 disabled:shadow-none disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2 font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)] text-white text-sm"
          >
            {currentStep === "review" ? "Proceed to Payment" : "Continue"}
            {currentStep !== "review" && <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
