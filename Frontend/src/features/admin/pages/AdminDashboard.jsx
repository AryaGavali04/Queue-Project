
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/AdminDashboard.scss";

import ADSidebar       from "../components/ADSidebar";
import ADTopbar        from "../components/ADTopbar";
import ADDashboardPage from "../components/ADDashboardPage";
import ADDoctorsPage   from "../components/ADDoctorsPage";
import ADServicesPage  from "../components/ADServicesPage";
import ADStaffPage     from "../components/ADStaffPage";
import ADQueuePage     from "../components/ADQueuePage";
import { DoctorModal, ServiceModal, StaffModal } from "../components/ADModals";

const API = "http://queue-project-1.onrender.com/api/admin";

const AdminDashboard = () => {
  const navigate    = useNavigate();
  const token       = localStorage.getItem("token");
  const username    = localStorage.getItem("username");
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization : `Bearer ${token}`
  };

  // ── UI ─────────────────────────────────────────────────────
  const [activePage,       setActivePage]       = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast,            setToast]            = useState(null);
  const [modal,            setModal]            = useState(null);

  // ── Data ───────────────────────────────────────────────────
  const [stats,    setStats]    = useState(null);
  const [doctors,  setDoctors]  = useState([]);
  const [services, setServices] = useState([]);
  const [staff,    setStaff]    = useState([]);
  const [queue,    setQueue]    = useState([]);

  // ── Forms ──────────────────────────────────────────────────
  const emptyDoctor  = { name:"", specialization:"", experience:"", timing:"", status:"Available", avgConsultationTime:10 };
  const emptyService = { name:"", description:"", counter:"", timing:"", status:"Available", avgServiceTimeMinutes:10 };
  const emptyStaff   = { username:"", email:"", password:"", confirmPassword:"" };

  const [doctorForm,  setDoctorForm]  = useState(emptyDoctor);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [staffForm,   setStaffForm]   = useState(emptyStaff);

  // ── Derived ────────────────────────────────────────────────
  const isHospital       = stats?.branchCategoryId === 1;
  const activeQueueCount = queue.filter(t =>
    ["BOOKED","CALLED","IN_PROGRESS"].includes(t.status)).length;

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") navigate("/login");
  }, []);

  // ── Fetch on mount ─────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  // ── Auto-refresh queue ─────────────────────────────────────
  useEffect(() => {
    const id = setInterval(fetchQueue, 30000);
    return () => clearInterval(id);
  }, []);

  // ── Fetchers ───────────────────────────────────────────────
  const fetchAll = () =>
    Promise.all([fetchStats(), fetchDoctors(), fetchServices(), fetchStaff(), fetchQueue()]);

  const fetchStats    = async () => { try { const r = await axios.get(`${API}/dashboard-stats`, { headers: authHeaders }); setStats(r.data); } catch(e){} };
  const fetchDoctors  = async () => { try { const r = await axios.get(`${API}/doctors`,          { headers: authHeaders }); setDoctors(Array.isArray(r.data) ? r.data : []); } catch(e){} };
  const fetchServices = async () => { try { const r = await axios.get(`${API}/services`,         { headers: authHeaders }); setServices(Array.isArray(r.data) ? r.data : []); } catch(e){} };
  const fetchStaff    = async () => { try { const r = await axios.get(`${API}/staff`,            { headers: authHeaders }); setStaff(Array.isArray(r.data) ? r.data : []); } catch(e){} };
  const fetchQueue    = async () => { try { const r = await axios.get(`${API}/queue/today`,      { headers: authHeaders }); setQueue(Array.isArray(r.data) ? r.data : []); } catch(e){} };

  // ── Toast ──────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // ── Doctor handlers ────────────────────────────────────────
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal?.data?.id) {
        await axios.put(`${API}/doctors/${modal.data.id}`, doctorForm, { headers: authHeaders });
        showToast("Doctor updated!");
      } else {
        await axios.post(`${API}/doctors`, doctorForm, { headers: authHeaders });
        showToast("Doctor added!");
      }
      setModal(null); setDoctorForm(emptyDoctor);
      fetchDoctors(); fetchStats();
    } catch(e) { showToast(e.response?.data?.message || "Failed.", "error"); }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;
    try {
      await axios.delete(`${API}/doctors/${id}`, { headers: authHeaders });
      showToast("Doctor deleted."); fetchDoctors(); fetchStats();
    } catch(e) { showToast(e.response?.data?.message || "Failed.", "error"); }
  };

  // ── Service handlers ───────────────────────────────────────
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal?.data?.id) {
        await axios.put(`${API}/services/${modal.data.id}`, serviceForm, { headers: authHeaders });
        showToast("Service updated!");
      } else {
        await axios.post(`${API}/services`, serviceForm, { headers: authHeaders });
        showToast("Service added!");
      }
      setModal(null); setServiceForm(emptyService);
      fetchServices(); fetchStats();
    } catch(e) { showToast(e.response?.data?.message || "Failed.", "error"); }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await axios.delete(`${API}/services/${id}`, { headers: authHeaders });
      showToast("Service deleted."); fetchServices(); fetchStats();
    } catch(e) { showToast(e.response?.data?.message || "Failed.", "error"); }
  };

  // ── Staff handlers ─────────────────────────────────────────
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (staffForm.password !== staffForm.confirmPassword) {
      showToast("Passwords do not match.", "error"); return;
    }
    try {
      await axios.post(`${API}/staff`, {
        username: staffForm.username,
        email:    staffForm.email,
        password: staffForm.password
      }, { headers: authHeaders });
      showToast("Staff created!"); setModal(null);
      setStaffForm(emptyStaff); fetchStaff(); fetchStats();
    } catch(e) { showToast(e.response?.data?.message || "Failed.", "error"); }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Remove this staff member?")) return;
    try {
      await axios.delete(`${API}/staff/${id}`, { headers: authHeaders });
      showToast("Staff removed."); fetchStaff(); fetchStats();
    } catch(e) { showToast(e.response?.data?.message || "Failed.", "error"); }
  };

  return (
    <div className={`ad-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>

      {/* Toast */}
      {toast && (
        <div className={`ad-toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span> {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <ADSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activePage={activePage}
        setActivePage={setActivePage}
        username={username}
        branchName={stats?.branchName}
        activeQueueCount={activeQueueCount}
        isHospital={isHospital}
        onLogout={handleLogout}
      />

      {/* Main */}
      <main className="ad-main">
        <ADTopbar
          activePage={activePage}
          stats={stats}
          onRefresh={fetchAll}
        />

        <div className="ad-content">

          {activePage === "dashboard" && (
            <ADDashboardPage
              stats={stats}
              isHospital={isHospital}
              doctors={doctors}
              services={services}
              queue={queue}
              setActivePage={setActivePage}
              setModal={setModal}
              setDoctorForm={setDoctorForm}
              setServiceForm={setServiceForm}
              setStaffForm={setStaffForm}
              emptyDoctor={emptyDoctor}
              emptyService={emptyService}
              emptyStaff={emptyStaff}
            />
          )}

          {activePage === "doctors" && isHospital && (
            <ADDoctorsPage
              doctors={doctors}
              setModal={setModal}
              setDoctorForm={setDoctorForm}
              emptyDoctor={emptyDoctor}
              onDelete={handleDeleteDoctor}
            />
          )}

          {activePage === "services" && !isHospital && (
            <ADServicesPage
              services={services}
              setModal={setModal}
              setServiceForm={setServiceForm}
              emptyService={emptyService}
              onDelete={handleDeleteService}
            />
          )}

          {activePage === "staff" && (
            <ADStaffPage
              staff={staff}
              setModal={setModal}
              setStaffForm={setStaffForm}
              emptyStaff={emptyStaff}
              onDelete={handleDeleteStaff}
            />
          )}

          {activePage === "queue" && (
            <ADQueuePage
              queue={queue}
              onRefresh={fetchQueue}
            />
          )}

        </div>
      </main>

      {/* Modals */}
      {modal?.type === "doctor" && (
        <DoctorModal
          modal={modal}
          doctorForm={doctorForm}
          setDoctorForm={setDoctorForm}
          onSubmit={handleDoctorSubmit}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "service" && (
        <ServiceModal
          modal={modal}
          serviceForm={serviceForm}
          setServiceForm={setServiceForm}
          onSubmit={handleServiceSubmit}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "staff" && (
        <StaffModal
          staffForm={staffForm}
          setStaffForm={setStaffForm}
          onSubmit={handleStaffSubmit}
          onClose={() => setModal(null)}
        />
      )}

    </div>
  );
};

export default AdminDashboard;