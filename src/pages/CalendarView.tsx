import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, MapPin } from 'lucide-react';
import { fetchApi } from '../services/api';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CalendarView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchApi('/api/calendar/events')
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-6 py-4 bg-[#0A192F] text-white">
        <div className="flex items-center gap-3">
          <CalendarIcon size={24} className="text-[#3A8D8F]" />
          <h2 className="text-xl font-black uppercase tracking-widest">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-white/10 transition-colors rounded-none border border-white/20"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 transition-colors rounded-none border border-white/20"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        {days.map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#6B7280]">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const dayEvents = events.filter(e => isSameDay(parseISO(e.date), cloneDay));

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border-r border-b border-[#E5E7EB] transition-all ${
              !isSameMonth(day, monthStart) ? 'bg-[#F9FAFB] text-[#E5E7EB]' : 'bg-white'
            } ${isSameDay(day, new Date()) ? 'bg-teal-50/30' : ''}`}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={`text-xs font-black ${isSameDay(day, new Date()) ? 'text-[#3A8D8F]' : 'text-[#0A192F]'}`}>
                {formattedDate}
              </span>
              {dayEvents.length > 0 && (
                <span className="bg-[#0A192F] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-none">
                  {dayEvents.length}
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div 
                  key={event.id}
                  className="text-[9px] font-bold p-1 bg-slate-100 border-l-2 border-[#0A192F] text-[#0A192F] truncate uppercase tracking-tighter"
                  title={event.title}
                >
                  {event.codigo}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[8px] font-bold text-[#9CA3AF] uppercase text-center">
                  + {dayEvents.length - 3} mais
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-white">{rows}</div>;
  };

  const selectedDateEvents = selectedDate ? events.filter(e => isSameDay(parseISO(e.date), selectedDate)) : [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">Calendário de Manutenções</h2>
        <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Previsão de visitas técnicas para os próximos 3 meses</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] shadow-xl overflow-hidden">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#0A192F] mb-4 border-b border-[#E5E7EB] pb-2">
              Detalhes do Dia: {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Selecione um dia'}
            </h3>
            
            <div className="space-y-4">
              {selectedDateEvents.length === 0 ? (
                <p className="text-[10px] text-[#9CA3AF] italic uppercase font-bold text-center py-8">Nenhuma manutenção prevista.</p>
              ) : (
                selectedDateEvents.map(event => (
                  <div key={event.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                    <div className="flex items-center gap-2 text-[#0A192F]">
                      <Package size={14} />
                      <span className="text-xs font-black uppercase">{event.codigo}</span>
                    </div>
                    <div className="text-[10px] font-bold text-[#6B7280] uppercase">{event.tipo}</div>
                    <div className="flex items-center gap-2 text-[#9CA3AF]">
                      <MapPin size={12} />
                      <span className="text-[10px] font-bold uppercase">{event.local}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#0A192F] p-6 text-white space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3A8D8F]">Legenda</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white border border-white/20" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Dia Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-50/30 border border-[#3A8D8F]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Hoje</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-100 border-l-2 border-[#0A192F]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Manutenção Prevista</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
