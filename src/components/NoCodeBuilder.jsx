import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, FileText, Settings, Users, PlusCircle, Play } from 'lucide-react';
import { api } from '../lib/api';

const Section = ({ title, children }) => (
  <div className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function NumberInput(props){
  return <Input type="number" step="0.01" {...props} />
}

export default function NoCodeBuilder(){
  const [schema, setSchema] = useState(null);
  const [settings, setSettings] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    api.schema().then(setSchema).catch(console.error);
    api.getSettings().then(setSettings).catch(console.error);
    api.listEmployees().then(setEmployees).catch(console.error);
    api.listTimeEntries().then(setEntries).catch(console.error);
  }, []);

  const [employeeForm, setEmployeeForm] = useState({
    full_name: '', personal_number: '', email: '', hourly_rate: 0, tax_table_percent: 30, vacation_supplement_percent: 12, active: true
  });

  const [entryForm, setEntryForm] = useState({
    employee_id: '', date: new Date().toISOString().slice(0,10), hours: 8, project: '', activity: '', overtime_multiplier: 1.0, pay_type: 'regular', note: ''
  });

  const [orgForm, setOrgForm] = useState({
    name: 'Företag AB', employer_contribution_percent: 31.42, default_tax_percent: 30, vacation_supplement_percent: 12, rounding_to_ore: true
  });

  useEffect(() => { if(settings) setOrgForm(settings); }, [settings]);

  const refresh = async () => {
    setEmployees(await api.listEmployees());
    setEntries(await api.listTimeEntries());
    setSettings(await api.getSettings());
  }

  const createEmployee = async () => {
    await api.createEmployee(employeeForm);
    setEmployeeForm({full_name:'', personal_number:'', email:'', hourly_rate:0, tax_table_percent:30, vacation_supplement_percent:12, active:true});
    await refresh();
  }

  const createEntry = async () => {
    await api.createTimeEntry(entryForm);
    setEntryForm({...entryForm, hours: 8, note: ''});
    await refresh();
  }

  const saveSettings = async () => {
    await api.saveSettings(orgForm);
    await refresh();
  }

  const [payrun, setPayrun] = useState(null);
  const generatePayrun = async () => {
    const today = new Date();
    const period_start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
    const period_end = new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().slice(0,10);
    const res = await api.generatePayrun({ period_start, period_end, include_vacation_supplement: true });
    setPayrun(res);
  }

  const kr = (v) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white">
        <h1 className="text-3xl font-black">No-code Tidrapport & Lön (Sverige)</h1>
        <p className="text-white/80 font-medium">Lägg till anställda, registrera timmar, spara inställningar och kör lönekörning – allt utan kod.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title={<span className="flex items-center gap-2"><Users className="w-5 h-5"/>Anställda</span>}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Namn" value={employeeForm.full_name} onChange={e=>setEmployeeForm(f=>({...f, full_name:e.target.value}))} />
            <Input label="Personnummer" value={employeeForm.personal_number} onChange={e=>setEmployeeForm(f=>({...f, personal_number:e.target.value}))} />
            <Input label="E-post" value={employeeForm.email} onChange={e=>setEmployeeForm(f=>({...f, email:e.target.value}))} />
            <NumberInput label="Timlön (SEK)" value={employeeForm.hourly_rate} onChange={e=>setEmployeeForm(f=>({...f, hourly_rate:parseFloat(e.target.value)||0}))} />
            <NumberInput label="Skatt %" value={employeeForm.tax_table_percent} onChange={e=>setEmployeeForm(f=>({...f, tax_table_percent:parseFloat(e.target.value)||0}))} />
            <NumberInput label="Semesterersättning %" value={employeeForm.vacation_supplement_percent} onChange={e=>setEmployeeForm(f=>({...f, vacation_supplement_percent:parseFloat(e.target.value)||0}))} />
          </div>
          <button onClick={createEmployee} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"><PlusCircle className="w-4 h-4"/>Lägg till</button>

          <div className="mt-4 divide-y">
            {employees.map(e=> (
              <div key={e.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-bold">{e.full_name}</div>
                  <div className="text-xs text-slate-500">Timlön {kr(e.hourly_rate)} • Skatt {e.tax_table_percent}%</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${e.active? 'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{e.active? 'Aktiv':'Inaktiv'}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title={<span className="flex items-center gap-2"><Clock className="w-5 h-5"/>Tidrapport</span>}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Anställd (id)" value={entryForm.employee_id} onChange={e=>setEntryForm(f=>({...f, employee_id:e.target.value}))} />
            <Input label="Datum" type="date" value={entryForm.date} onChange={e=>setEntryForm(f=>({...f, date:e.target.value}))} />
            <NumberInput label="Timmar" value={entryForm.hours} onChange={e=>setEntryForm(f=>({...f, hours:parseFloat(e.target.value)||0}))} />
            <NumberInput label="OB/Ot-faktor" value={entryForm.overtime_multiplier} onChange={e=>setEntryForm(f=>({...f, overtime_multiplier:parseFloat(e.target.value)||1}))} />
            <Input label="Projekt" value={entryForm.project} onChange={e=>setEntryForm(f=>({...f, project:e.target.value}))} />
            <Input label="Aktivitet" value={entryForm.activity} onChange={e=>setEntryForm(f=>({...f, activity:e.target.value}))} />
            <Input label="Anteckning" value={entryForm.note} onChange={e=>setEntryForm(f=>({...f, note:e.target.value}))} />
          </div>
          <button onClick={createEntry} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"><PlusCircle className="w-4 h-4"/>Spara tid</button>

          <div className="mt-4 max-h-56 overflow-auto divide-y">
            {entries.slice(0,20).map(t => (
              <div key={t.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-bold">{t.date} • {t.hours}h × {t.overtime_multiplier}x</div>
                  <div className="text-xs text-slate-500">{t.project || 'Projekt'} – {t.activity || 'Aktivitet'}</div>
                </div>
                <div className="text-xs font-semibold text-slate-700">{kr(t.hours * (employees.find(e=>e.id===t.employee_id)?.hourly_rate || 0) * (t.overtime_multiplier||1))}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={<span className="flex items-center gap-2"><Settings className="w-5 h-5"/>Inställningar</span>}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Företagsnamn" value={orgForm.name} onChange={e=>setOrgForm(f=>({...f, name:e.target.value}))} />
            <NumberInput label="Arbetsgivaravgifter %" value={orgForm.employer_contribution_percent} onChange={e=>setOrgForm(f=>({...f, employer_contribution_percent:parseFloat(e.target.value)||0}))} />
            <NumberInput label="Skatt % (default)" value={orgForm.default_tax_percent} onChange={e=>setOrgForm(f=>({...f, default_tax_percent:parseFloat(e.target.value)||0}))} />
            <NumberInput label="Semesterersättning %" value={orgForm.vacation_supplement_percent} onChange={e=>setOrgForm(f=>({...f, vacation_supplement_percent:parseFloat(e.target.value)||0}))} />
          </div>
          <button onClick={saveSettings} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"><PlusCircle className="w-4 h-4"/>Spara</button>
        </Section>

        <Section title={<span className="flex items-center gap-2"><FileText className="w-5 h-5"/>Lönekörning</span>}>
          <p className="text-sm text-slate-600 mb-3">Kör en snabb lönekörning för aktuell månad.</p>
          <button onClick={generatePayrun} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"><Play className="w-4 h-4"/>Generera</button>

          {payrun && (
            <div className="mt-4">
              <div className="font-bold">Period: {payrun.period_start} – {payrun.period_end}</div>
              <div className="mt-2 space-y-2">
                {payrun.lines.map((l, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold">{l.employee_name}</div>
                      <div className="text-xs text-slate-500">{l.hours}h × {kr(l.base_rate)}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>Brutto: <b>{kr(l.gross_amount)}</b></div>
                      <div>Skatt: <b>{kr(l.tax_withheld)}</b></div>
                      <div>Netto: <b>{kr(l.net_pay)}</b></div>
                      <div>AG: <b>{kr(l.employer_contribution)}</b></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 font-bold">
                Totalt • Brutto {kr(payrun.total_gross)} • Skatt {kr(payrun.total_tax)} • Netto {kr(payrun.total_net)} • AG {kr(payrun.total_employer_contribution)}
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
