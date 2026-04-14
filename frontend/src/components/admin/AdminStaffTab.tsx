/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Mail, Phone, Briefcase, 
  Trash2, ShieldCheck, Loader2, ArrowRight, 
  Clock, CheckCircle, AlertCircle 
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

interface AdminStaffTabProps {
  apiUrl: string;
}

export default function AdminStaffTab({ apiUrl }: AdminStaffTabProps) {
  const { user }: any = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const headers = {
    Authorization: `Bearer ${user?.backendToken}`
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, orderRes] = await Promise.all([
        fetch(`${apiUrl}/admin/employees`, { headers }),
        fetch(`${apiUrl}/admin/orders`, { headers })
      ]);
      const empData = await empRes.json();
      const orderData = await orderRes.json();
      
      setEmployees(empData.employees || []);
      setOrders(orderData.orders || []);
    } catch (err) {
      console.error("Staff fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (employeeId: string, status: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/employees/${employeeId}/status`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Employee ${status.toLowerCase()} successfully`);
        fetchData();
      }
    } catch (err) {
      alert("Status update failed");
    }
  };

  const handleAssign = async (employeeId: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/orders/assign`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderId: selectedOrder.id, employeeId })
      });
      if (res.ok) {
        alert("Employee assigned successfully");
        setShowAssignModal(false);
        fetchData();
      }
    } catch (err) {
      alert("Assignment failed");
    }
  };

  if (loading) return (
    <div className="flex justify-center p-32">
      <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center">
               <ShieldCheck size={28} />
            </div>
            <div>
               <p className="text-zinc-400 text-xs font-bold uppercase">Approved Staff</p>
               <h3 className="text-2xl font-bold dark:text-white">{employees.filter(e => e.status === 'APPROVED').length}</h3>
            </div>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 rounded-2xl flex items-center justify-center">
               <Clock size={28} />
            </div>
            <div>
               <p className="text-zinc-400 text-xs font-bold uppercase">Pending Reg.</p>
               <h3 className="text-2xl font-bold dark:text-white">{employees.filter(e => e.status === 'PENDING').length}</h3>
            </div>
         </div>
         <div className="bg-[var(--color-royal-brown)] text-white p-8 rounded-[2rem] shadow-xl flex items-center gap-6">
            <div className="w-14 h-14 bg-white/10 text-[var(--color-gold)] rounded-2xl flex items-center justify-center">
               <Briefcase size={28} />
            </div>
            <div>
               <p className="text-white/60 text-xs font-bold uppercase">Unassigned Orders</p>
               <h3 className="text-2xl font-bold text-[var(--color-gold)]">{orders.filter(o => !o.employeeId).length}</h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Employees List */}
        <section>
          <div className="flex items-center justify-between mb-6 px-4">
            <h2 className="text-xl font-bold dark:text-white">Active Workforce</h2>
            <button className="text-[var(--color-gold)] text-xs font-bold uppercase flex items-center gap-2">Invite Member <UserPlus size={14} /></button>
          </div>
          <div className="space-y-4">
            {employees.map(emp => (
              <div key={emp.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group hover:border-[var(--color-gold)] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--color-gold)] font-bold">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{emp.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">{emp.assignedService.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        emp.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                        emp.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {emp.status}
                      </span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      {emp.status === 'PENDING' ? (
                        <>
                          <button 
                            onClick={() => handleStatusChange(emp.id, 'APPROVED')}
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(emp.id, 'REJECTED')}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                            title="Reject"
                          >
                            <AlertCircle size={18} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleStatusChange(emp.id, emp.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED')}
                          className={`p-2 rounded-xl transition-all ${
                            emp.status === 'SUSPENDED' 
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white' 
                              : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600'
                          }`}
                          title={emp.status === 'SUSPENDED' ? "Unsuspend" : "Suspend"}
                        >
                          <AlertCircle size={18} />
                        </button>
                      )}
                      
                      <button className="p-2 text-zinc-300 hover:text-red-500 transition-colors ml-4">
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Unassigned Work Queue */}
        <section>
          <div className="flex items-center justify-between mb-6 px-4">
            <h2 className="text-xl font-bold dark:text-white">Pending Assignments</h2>
            <span className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold">Urgent</span>
          </div>
          <div className="space-y-4">
             {orders.filter(o => !o.employeeId).length === 0 ? (
               <div className="p-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl uppercase text-xs font-bold">
                 All tasks assigned
               </div>
             ) : orders.filter(o => !o.employeeId).map(order => (
               <div key={order.id} className="bg-zinc-900 dark:bg-white p-6 rounded-3xl text-white dark:text-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black text-[var(--color-gold)] tracking-widest">{order.serviceType.replace('_', ' ')}</span>
                    <h4 className="font-bold">{order.customerName}</h4>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[200px] line-clamp-1">{order.description}</p>
                 </div>
                 <button 
                  onClick={() => { setSelectedOrder(order); setShowAssignModal(true); }}
                  className="w-full sm:w-auto px-6 py-3 bg-[var(--color-gold)] text-zinc-950 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-white transition-colors"
                 >
                   Assign <ArrowRight size={14} />
                 </button>
               </div>
             ))}
          </div>
        </section>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xl z-[80] flex items-center justify-center p-6">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] p-10 border border-white/5 shadow-2xl">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Assign Workforce</h3>
              <p className="text-zinc-500 text-sm mb-8">Select which authorized expert will handle {selectedOrder.customerName}'s request.</p>
              
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                 {employees.filter(e => e.status === 'APPROVED' && e.assignedService === selectedOrder.serviceType).map(emp => (
                   <button 
                    key={emp.id} 
                    onClick={() => handleAssign(emp.id)}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-[var(--color-gold)] hover:text-zinc-950 rounded-2xl flex items-center justify-between group transition-all"
                   >
                     <div className="flex items-center gap-3 text-left">
                        <Users size={16} />
                        <div>
                          <p className="font-bold text-sm">{emp.name}</p>
                          <p className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-zinc-800">Available expert</p>
                        </div>
                     </div>
                     <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                 ))}
                 {employees.filter(e => e.status === 'APPROVED' && e.assignedService === selectedOrder.serviceType).length === 0 && (
                   <div className="p-8 text-center text-zinc-400 text-xs italic">
                     No approved employees available for this service type.
                   </div>
                 )}
              </div>
              
              <button 
                onClick={() => setShowAssignModal(false)}
                className="w-full mt-6 py-4 text-zinc-400 font-bold uppercase text-xs hover:text-red-500 transition-colors"
              >
                Go Back
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
