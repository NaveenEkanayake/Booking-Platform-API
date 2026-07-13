import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  LogOut, 
  BookOpen, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
}

interface ServiceEntity {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
}

interface Booking {
  id: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  service: ServiceEntity;
  bookingDate: string;
  bookingTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
  createdAt: string;
}

export default function App() {
  // Authentication state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<UserInfo | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Navigation & Tabs
  const [currentView, setCurrentView] = useState<'landing' | 'customer' | 'admin'>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser) as UserInfo;
      return parsed.role === 'ADMIN' ? 'admin' : 'customer';
    }
    return 'landing';
  });
  const [authTab, setAuthTab] = useState<'customer_login' | 'customer_register' | 'staff_login'>('customer_login');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Business state
  const [services, setServices] = useState<ServiceEntity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceEntity | null>(null);

  // Pagination & Filtering (Admin only)
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatus, setAdminStatus] = useState<string>('');
  const [adminPage, setAdminPage] = useState(1);
  const [adminLimit] = useState(10);
  const [adminTotalPages, setAdminTotalPages] = useState(1);
  const [adminTotalCount, setAdminTotalCount] = useState(0);

  // Forms
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookingDate: '',
    bookingTime: '',
    notes: '',
  });

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
  });

  const [serviceForm, setServiceForm] = useState({
    id: '', // Empty means creating new
    title: '',
    description: '',
    duration: 30,
    price: 0,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditingService, setIsEditingService] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Auto-dismiss feedback message
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Handle API Requests helper
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please log in again.');
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        // Fallback if not valid JSON
      }
    }

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || 'Something went wrong';
      throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
    return data;
  };

  // Load initial services catalog
  const loadServices = async () => {
    try {
      setLoading(true);
      if (token && user?.role === 'ADMIN') {
        const data = await apiFetch('/api/services');
        setServices(data);
      } else {
        const data = await apiFetch('/api/services/public');
        setServices(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load customer appointments
  const loadCustomerBookings = async () => {
    if (!token || user?.role !== 'CUSTOMER') return;
    try {
      setLoading(true);
      const data = await apiFetch('/api/bookings/my-bookings');
      setBookings(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load admin master booking board
  const loadAdminBookings = async () => {
    if (!token || user?.role !== 'ADMIN') return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: adminPage.toString(),
        limit: adminLimit.toString(),
      });
      if (adminSearch) queryParams.set('search', adminSearch);
      if (adminStatus) queryParams.set('status', adminStatus);

      const res = await apiFetch(`/api/bookings?${queryParams.toString()}`);
      setBookings(res.data);
      setAdminTotalPages(res.meta.totalPages);
      setAdminTotalCount(res.meta.total);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading depending on active view and state changes
  useEffect(() => {
    loadServices();
  }, [token, user]);

  useEffect(() => {
    if (currentView === 'customer') {
      loadCustomerBookings();
    } else if (currentView === 'admin') {
      loadAdminBookings();
    }
  }, [currentView, adminPage, adminSearch, adminStatus]);

  // Auth operations
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authTab === 'customer_register') {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
            name: authForm.name,
          }),
        });
        setToken(res.accessToken);
        setUser(res.user);
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        setCurrentView('customer');
        setSuccessMsg(`Welcome, ${res.user.name}!`);
        setShowAuthModal(false);
      } else {
        // Logins (customer or staff)
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
          }),
        });

        // Verify role constraints (Staff login must yield ADMIN role, Customer login must yield CUSTOMER role)
        if (authTab === 'staff_login' && res.user.role !== 'ADMIN') {
          throw new Error('Access denied. This portal is for Staff/Admin only.');
        }
        if (authTab === 'customer_login' && res.user.role !== 'CUSTOMER') {
          throw new Error('Please use the Staff Portal to log in with an Admin account.');
        }

        setToken(res.accessToken);
        setUser(res.user);
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        setCurrentView(res.user.role === 'ADMIN' ? 'admin' : 'customer');
        setSuccessMsg(`Logged in successfully as ${res.user.name}.`);
        setShowAuthModal(false);
      }

      // Reset form
      setAuthForm({ email: '', password: '', name: '' });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('landing');
    setBookings([]);
    setSuccessMsg('Logged out successfully.');
  };

  // Booking creation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          customerName: bookingForm.customerName,
          customerEmail: bookingForm.customerEmail,
          customerPhone: bookingForm.customerPhone,
          serviceId: selectedService.id,
          bookingDate: bookingForm.bookingDate,
          bookingTime: bookingForm.bookingTime,
          notes: bookingForm.notes || undefined,
        }),
      });

      setSuccessMsg('Booking requested successfully! Status: PENDING.');
      setSelectedService(null);
      setBookingForm({
        customerName: user ? user.name : '',
        customerEmail: user ? user.email : '',
        customerPhone: '',
        bookingDate: '',
        bookingTime: '',
        notes: '',
      });

      if (currentView === 'customer') {
        loadCustomerBookings();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill user data into booking form when service selected
  const selectServiceForBooking = (service: ServiceEntity) => {
    setSelectedService(service);
    setBookingForm(prev => ({
      ...prev,
      customerName: user ? user.name : prev.customerName,
      customerEmail: user ? user.email : prev.customerEmail,
    }));
    // scroll to form
    setTimeout(() => {
      document.getElementById('booking-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Customer cancellations
  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await apiFetch(`/api/bookings/${id}/cancel-my-booking`, {
        method: 'PATCH',
      });
      setSuccessMsg('Appointment cancelled successfully.');
      loadCustomerBookings();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin Service Operations
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const payload = {
        title: serviceForm.title,
        description: serviceForm.description || undefined,
        duration: Number(serviceForm.duration),
        price: Number(serviceForm.price),
      };

      if (isEditingService) {
        await apiFetch(`/api/services/${serviceForm.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Service updated successfully.');
      } else {
        await apiFetch('/api/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('New service created successfully.');
      }

      setServiceForm({ id: '', title: '', description: '', duration: 30, price: 0 });
      setIsEditingService(false);
      loadServices();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditServiceClick = (service: ServiceEntity) => {
    setServiceForm({
      id: service.id,
      title: service.title,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
    });
    setIsEditingService(true);
    document.getElementById('service-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service permanently?')) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await apiFetch(`/api/services/${id}`, { method: 'DELETE' });
      setSuccessMsg('Service deleted successfully.');
      loadServices();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServiceActive = async (service: ServiceEntity) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await apiFetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      setSuccessMsg(`Service status updated to ${!service.isActive ? 'Active' : 'Inactive'}.`);
      loadServices();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin Booking Operations
  const handleUpdateBookingStatus = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await apiFetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMsg(`Booking status updated to ${newStatus}.`);
      loadAdminBookings();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper colors for status badges
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'CONFIRMED':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Global Toast Alert */}
      {(errorMsg || successMsg) && (
        <div className="fixed top-6 right-6 z-50 animate-bounce shadow-2xl">
          {errorMsg && (
            <div className="bg-rose-950 border border-rose-800 text-rose-100 px-4 py-3 rounded-lg flex items-center gap-3 backdrop-blur-xl">
              <AlertCircle size={20} className="text-rose-400" />
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="ml-auto hover:text-rose-300">
                <X size={16} />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-950 border border-emerald-800 text-emerald-100 px-4 py-3 rounded-lg flex items-center gap-3 backdrop-blur-xl">
              <Check size={20} className="text-emerald-400" />
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="ml-auto hover:text-emerald-300">
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
          if (!user) setCurrentView('landing');
          else if (user.role === 'ADMIN') setCurrentView('admin');
          else setCurrentView('customer');
        }}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Calendar size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            EN2H Booking Board
          </span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                <Shield size={14} className={user.role === 'ADMIN' ? 'text-indigo-400' : 'text-slate-400'} />
                <span className="text-sm font-medium text-slate-300">{user.name}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-lg text-sm transition-all text-slate-300 hover:text-white"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setAuthTab('customer_login');
                setShowAuthModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 transition-all duration-200"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── LANDING VIEW (UNAUTHENTICATED GUESTS) ── */}
        {currentView === 'landing' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto py-8">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                Exceptional Services,<br />Seamlessly Booked.
              </h1>
              <p className="text-slate-400 text-base md:text-lg">
                Explore our catalog of services and book a time slot directly without needing an account, or log in to manage your appointments online.
              </p>
              <div className="pt-2 flex justify-center gap-4">
                <button
                  onClick={() => {
                    const el = document.getElementById('catalog-anchor');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg text-sm font-semibold text-white shadow-lg transition-all"
                >
                  Explore Catalog
                </button>
                <button
                  onClick={() => {
                    setAuthTab('customer_register');
                    setShowAuthModal(true);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 px-6 py-3 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition-all"
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Catalog Section */}
            <div id="catalog-anchor" className="space-y-6 pt-6">
              <div className="flex justify-between items-end border-b border-slate-900 pb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Available Services</h2>
                  <p className="text-slate-400 text-sm">Select a service to initiate your booking request.</p>
                </div>
              </div>

              {services.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center text-slate-500">
                  <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-lg">No active services available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div 
                      key={service.id} 
                      className={`glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between ${
                        selectedService?.id === service.id ? 'ring-2 ring-indigo-500' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-lg text-slate-200 line-clamp-1">{service.title}</h3>
                          <span className="text-xs uppercase font-extrabold tracking-wider bg-slate-900 text-slate-400 border border-slate-800 px-2.5 py-1 rounded-full">
                            Active
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-3 min-h-[60px]">{service.description || 'No description provided.'}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Clock size={12} className="text-indigo-400" />
                            <span>{service.duration} mins</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-lg font-bold text-indigo-400">
                            <DollarSign size={16} />
                            <span>{service.price.toFixed(2)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => selectServiceForBooking(service)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            selectedService?.id === service.id 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
                          }`}
                        >
                          {selectedService?.id === service.id ? 'Selected' : 'Book Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Form Anchor */}
            {selectedService && (
              <div id="booking-form-anchor" className="max-w-2xl mx-auto glass-panel rounded-2xl p-8 space-y-6 border border-indigo-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">Submit Booking Request</h3>
                    <p className="text-sm text-indigo-400">Selected Service: {selectedService.title}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedService(null)}
                    className="p-1 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Full Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={bookingForm.customerName}
                          onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                          placeholder="e.g. Jane Smith"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={bookingForm.customerEmail}
                          onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                          placeholder="e.g. jane@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="tel"
                          required
                          value={bookingForm.customerPhone}
                          onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date</label>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        value={bookingForm.bookingDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Time</label>
                      <input
                        type="time"
                        required
                        value={bookingForm.bookingTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, bookingTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notes (Optional)</label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none min-h-[80px] transition-all"
                      placeholder="Add any request notes..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg text-sm shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    Submit Request
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── CUSTOMER DASHBOARD (AUTHENTICATED CUSTOMER) ── */}
        {currentView === 'customer' && (
          <div className="space-y-12">
            <div className="border-b border-slate-900 pb-4">
              <h1 className="text-3xl font-extrabold tracking-tight">Customer Portal</h1>
              <p className="text-slate-400 text-sm">Schedule appointments and monitor your booking status.</p>
            </div>

            {/* Catalog Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight">Services Catalog</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div 
                    key={service.id} 
                    className={`glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between ${
                      selectedService?.id === service.id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-slate-200 line-clamp-1">{service.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-3 min-h-[60px]">{service.description || 'No description provided.'}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Clock size={12} className="text-indigo-400" />
                          <span>{service.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-lg font-bold text-indigo-400">
                          <DollarSign size={16} />
                          <span>{service.price.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => selectServiceForBooking(service)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          selectedService?.id === service.id 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
                        }`}
                      >
                        {selectedService?.id === service.id ? 'Selected' : 'Book Slots'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Form (Only displayed when a service is selected) */}
            {selectedService && (
              <div id="booking-form-anchor" className="max-w-2xl mx-auto glass-panel rounded-2xl p-8 space-y-6 border border-indigo-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">Submit Booking Request</h3>
                    <p className="text-sm text-indigo-400">Service: {selectedService.title}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedService(null)}
                    className="p-1 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.customerName}
                        onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                      <input
                        type="email"
                        required
                        value={bookingForm.customerEmail}
                        onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.customerPhone}
                        onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date</label>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        value={bookingForm.bookingDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Time</label>
                      <input
                        type="time"
                        required
                        value={bookingForm.bookingTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, bookingTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notes (Optional)</label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none min-h-[80px] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg text-sm shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    Submit Booking
                  </button>
                </form>
              </div>
            )}

            {/* My Appointments Table */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">My Appointments</h2>
              {bookings.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center text-slate-500">
                  <Activity size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-lg">No appointments found. Book your first session above!</p>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-950/60">
                          <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Service</th>
                          <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Date / Time</th>
                          <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Duration</th>
                          <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Price</th>
                          <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                          <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-900/20 transition-all">
                            <td className="p-4">
                              <span className="font-semibold text-slate-200">{booking.service?.title || 'Unknown service'}</span>
                            </td>
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <div className="text-sm font-medium text-slate-300">{booking.bookingDate}</div>
                                <div className="text-xs text-indigo-400">{booking.bookingTime}</div>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-slate-300">
                              <span>{booking.service?.duration || '-'} mins</span>
                            </td>
                            <td className="p-4 text-sm font-medium text-slate-300">
                              <span>${booking.service?.price.toFixed(2) || '-'}</span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(booking.status)}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' ? (
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-900/30 px-3 py-1.5 rounded-lg hover:text-rose-300 transition-all"
                                >
                                  Cancel Booking
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ADMIN VIEW (AUTHENTICATED ADMIN) ── */}
        {currentView === 'admin' && (
          <div className="space-y-12">
            <div className="border-b border-slate-900 pb-4">
              <h1 className="text-3xl font-extrabold tracking-tight">Staff Portal</h1>
              <p className="text-slate-400 text-sm">Control site services catalog and administer all appointments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Column */}
              <div id="service-form-anchor" className="lg:col-span-1 space-y-6">
                <div className="glass-panel rounded-2xl p-6 space-y-6 border border-slate-900">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      {isEditingService ? 'Edit Service' : 'Add New Service'}
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Configure details for services offered.
                    </p>
                  </div>

                  <form onSubmit={handleServiceSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Title</label>
                      <input
                        type="text"
                        required
                        value={serviceForm.title}
                        onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                        placeholder="e.g. Beard Grooming"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
                      <textarea
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none min-h-[85px] transition-all"
                        placeholder="e.g. Outline detailing with hot razor..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Duration (mins)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={serviceForm.duration}
                          onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Price ($)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={serviceForm.price}
                          onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-all"
                      >
                        {isEditingService ? 'Save Changes' : 'Create Service'}
                      </button>
                      {isEditingService && (
                        <button
                          type="button"
                          onClick={() => {
                            setServiceForm({ id: '', title: '', description: '', duration: 30, price: 0 });
                            setIsEditingService(false);
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-4 rounded-lg text-sm hover:bg-slate-800 transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Services List Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel rounded-2xl p-6 border border-slate-900 space-y-4">
                  <h2 className="text-xl font-bold tracking-tight">Active Catalog Management</h2>

                  {services.length === 0 ? (
                    <p className="text-slate-500 text-sm">No services listed yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-900">
                      {services.map((service) => (
                        <div key={service.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-slate-200">{service.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-1">{service.description || 'No description.'}</p>
                            <div className="flex gap-4 text-xs font-semibold text-indigo-400">
                              <span>{service.duration} mins</span>
                              <span>${service.price.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleServiceActive(service)}
                              className={`text-xs px-2.5 py-1 rounded-full font-bold border transition-all ${
                                service.isActive
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900/30'
                                  : 'bg-rose-950/40 text-rose-400 border-rose-900/30 hover:bg-rose-900/30'
                              }`}
                            >
                              {service.isActive ? 'Active' : 'Inactive'}
                            </button>

                            <button
                              onClick={() => handleEditServiceClick(service)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
                              title="Edit Details"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all"
                              title="Delete Service"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Master Bookings Board */}
            <div className="space-y-6 pt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Master Booking Board</h2>
                  <p className="text-slate-400 text-xs mt-1">Review, authorize, or cancel bookings site-wide.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Filters */}
                  <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs">
                    {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setAdminStatus(s);
                          setAdminPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                          adminStatus === s ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {s || 'ALL'}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search name/email..."
                      value={adminSearch}
                      onChange={(e) => {
                        setAdminSearch(e.target.value);
                        setAdminPage(1);
                      }}
                      className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 outline-none w-48 transition-all"
                    />
                  </div>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center text-slate-500">
                  <FileText size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-lg">No appointments records matching criteria found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-900 bg-slate-950/60">
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Client Details</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Service Selected</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Schedule</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Status</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Manage Booking</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60">
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-slate-900/20 transition-all text-sm">
                              <td className="p-4">
                                <div className="space-y-1">
                                  <div className="font-semibold text-slate-200">{booking.customerName}</div>
                                  <div className="text-xs text-slate-400">{booking.customerEmail}</div>
                                  <div className="text-xs text-slate-500">{booking.customerPhone}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="space-y-1">
                                  <div className="font-medium text-slate-300">{booking.service?.title || 'Unknown'}</div>
                                  <div className="text-xs text-indigo-400">${booking.service?.price.toFixed(2)} / {booking.service?.duration} mins</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-slate-300">{booking.bookingDate}</div>
                                  <div className="text-xs text-indigo-400">{booking.bookingTime}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="p-4">
                                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' ? (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {booking.status === 'PENDING' && (
                                      <button
                                        onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                                        className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-900/30 hover:bg-indigo-900/35 px-2.5 py-1.5 rounded"
                                      >
                                        Confirm
                                      </button>
                                    )}

                                    {booking.status === 'CONFIRMED' && (
                                      <button
                                        onClick={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}
                                        className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-900/35 px-2.5 py-1.5 rounded"
                                      >
                                        Complete
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                      className="text-[10px] font-bold uppercase tracking-wider bg-rose-950/40 text-rose-400 border border-rose-905/30 hover:bg-rose-900/35 px-2.5 py-1.5 rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500">Board Lock</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination Navigation */}
                  {adminTotalPages > 1 && (
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 px-1">
                      <span>
                        Showing page {adminPage} of {adminTotalPages} (Total {adminTotalCount} items)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={adminPage === 1}
                          onClick={() => setAdminPage(p => Math.max(1, p - 1))}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-all"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          disabled={adminPage === adminTotalPages}
                          onClick={() => setAdminPage(p => Math.min(adminTotalPages, p + 1))}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-all"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-900 text-xs">
              <button
                onClick={() => setAuthTab('customer_login')}
                className={`flex-1 py-4 font-bold border-b-2 tracking-wider uppercase text-center ${
                  authTab === 'customer_login'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Client Login
              </button>
              <button
                onClick={() => setAuthTab('customer_register')}
                className={`flex-1 py-4 font-bold border-b-2 tracking-wider uppercase text-center ${
                  authTab === 'customer_register'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Client Register
              </button>
              <button
                onClick={() => setAuthTab('staff_login')}
                className={`flex-1 py-4 font-bold border-b-2 tracking-wider uppercase text-center ${
                  authTab === 'staff_login'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Staff Portal
              </button>
            </div>

            {/* Auth Form Container */}
            <form onSubmit={handleAuth} className="p-8 space-y-4">
              <h3 className="text-lg font-bold tracking-tight text-center text-slate-100">
                {authTab === 'customer_login' && 'Sign in to your client account'}
                {authTab === 'customer_register' && 'Register client profile'}
                {authTab === 'staff_login' && 'Administrator authorization'}
              </h3>

              {authTab === 'customer_register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm tracking-wide shadow-lg shadow-indigo-600/20 transition-all duration-200 mt-2"
              >
                {authTab === 'customer_login' && 'Sign In'}
                {authTab === 'customer_register' && 'Register Account'}
                {authTab === 'staff_login' && 'Log In Staff'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <footer className="w-full border-t border-slate-900 glass-panel px-6 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Booking Board. All Rights Reserved. Built with NestJS, SQLite, React & Tailwind.</p>
      </footer>
    </div>
  );
}
