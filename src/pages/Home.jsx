
import React from "react";
import { useNavigate } from "react-router-dom";
import CardButton from "../components/CardButton";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
        🎓 PlanUTM 📊
      </h1>
      <p className="mb-8 text-lg md:text-xl italic">
        “Promedio y Horario, sin drama diario 😎✌️”
      </p>
      <div className="cards-container" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center' }}>
        <CardButton
          title="Calculadora de Promedio"
          description="Calcula tu promedio de manera fácil y rápida."
          icon={<span role="img" aria-label="calculadora">🧮</span>}
          onClick={() => navigate('/calculator')}
        />
        <CardButton
          title="Creador de Horarios"
          description="Organiza tus materias y crea tu horario ideal."
          icon={<span role="img" aria-label="horario">📅</span>}
          onClick={() => navigate('/schedule-creator')}
        />
      </div>
    </div>
  );
}
