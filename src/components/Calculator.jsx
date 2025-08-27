import { useState, useMemo } from "react";

export default function Calculator() {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState({ medio: [], final: [], medioTotal: null, finalTotal: null });
  const [medioExam, setMedioExam] = useState(null);
  const [finalExam, setFinalExam] = useState(null);
  const [iaResponse, setIaResponse] = useState(null);

  // Extrae números, acepta coma o punto decimal
  const extractNumbers = (text) => {
    const matches = text.match(/\d{1,3}(?:[\.,]\d+)?/g);
    if (!matches) return [];
    return matches.map((m) => parseFloat(m.replace(',', '.')));
  };

  const parseInput = () => {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const medio = [];
    const final = [];
    const unassigned = [];
    const medioTotals = [];
    const finalTotals = [];
    const medioExams = [];
    const finalExams = [];

    for (const line of lines) {
      const nums = extractNumbers(line);
      if (nums.length === 0) continue;
      const l = line.toLowerCase();

      if (/total\s*ciclo\s*1|total\s*ciclo.*1/i.test(l)) { medioTotals.push(...nums); continue; }
      if (/total\s*ciclo\s*2|total\s*ciclo.*2/i.test(l)) { finalTotals.push(...nums); continue; }

      if (/examen.*medio|examen de medio|examen medio|examen de medio ciclo/i.test(l)) { medioExams.push(...nums); continue; }
      if (/examen.*fin|examen.*final|examen fin de ciclo|examen fin|examen final/i.test(l)) { finalExams.push(...nums); continue; }

      const hasMedio = /medio|parcial|mitad|mid/i.test(l);
      const hasFinal = /final|fin|ciclo 2|ciclo 1/i.test(l);

      if (hasMedio && !hasFinal) medio.push(...nums);
      else if (hasFinal && !hasMedio) final.push(...nums);
      else if (hasMedio && hasFinal) {
        if (nums.length === 1) unassigned.push(...nums);
        else { const half = Math.ceil(nums.length/2); medio.push(...nums.slice(0,half)); final.push(...nums.slice(half)); }
      } else {
        if (/total/i.test(l) && nums.length === 1) { if (medioTotals.length === 0) medioTotals.push(...nums); else finalTotals.push(...nums); }
        else unassigned.push(...nums);
      }
    }

    const medioTotal = medioTotals.length>0 ? medioTotals[0] : null;
    const finalTotal = finalTotals.length>0 ? finalTotals[0] : null;

    if (medio.length === 0 && final.length === 0 && unassigned.length>0) {
      if (unassigned.length === 2) { medio.push(unassigned[0]); final.push(unassigned[1]); }
      else { const half = Math.floor(unassigned.length/2); medio.push(...unassigned.slice(0,half)); final.push(...unassigned.slice(half)); }
    } else if (unassigned.length>0) final.push(...unassigned);

    const medioExamVal = medioExams.length>0 ? medioExams[0] : (medio.length>0 ? Math.min(...medio) : null);
    const finalExamVal = finalExams.length>0 ? finalExams[0] : (final.length>0 ? Math.min(...final) : null);

    setParsed({ medio, final, medioTotal, finalTotal });
    if (medioExamVal!=null) setMedioExam(medioExamVal);
    if (finalExamVal!=null) setFinalExam(finalExamVal);
  };

  const medioSum = useMemo(() => (parsed.medioTotal!=null ? Number(parsed.medioTotal) : parsed.medio.reduce((a,b)=>a+b,0)), [parsed]);
  const finalSum = useMemo(() => (parsed.finalTotal!=null ? Number(parsed.finalTotal) : parsed.final.reduce((a,b)=>a+b,0)), [parsed]);
  const total = Number((medioSum+finalSum) || 0);

  const getSupletorio = () => {
    const candidates = [];
    if (medioExam!=null) candidates.push(Number(medioExam));
    if (finalExam!=null) candidates.push(Number(finalExam));
    if (candidates.length === 0) return null;
    const lowerExam = Math.min(...candidates);
    const adjustedTotal = Number((total - lowerExam).toFixed(2));
    const need = Number(Math.max(0,70 - adjustedTotal).toFixed(2));
    return { lowerExam: Number(lowerExam.toFixed(2)), adjustedTotal, need };
  };

  const supleResult = useMemo(getSupletorio, [medioExam, finalExam, total]);

  const fetchExplain = async () => {
    try {
      const prompt = `Extrae un JSON con medio_total, final_total, medio_exams (array), final_exams (array) a partir del siguiente texto:\n\n${rawText}`;
      const r = await fetch('/api/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await r.json();
      setIaResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setIaResponse('Error llamando al servicio IA. Revisa la consola.');
    }
  };

  return (
    <div className="bg-white text-gray-800 rounded-2xl shadow-xl p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Calculadora rápida de supletorio</h2>

      <p className="mb-2 text-sm text-gray-600">Pega aquí las notas copiadas de la plataforma (texto desordenado). El parser extraerá números e intentará identificar "Examen" y "Total Ciclo".</p>
      <textarea value={rawText} onChange={(e)=>setRawText(e.target.value)} rows={10} className="w-full p-3 border rounded-md mb-3" placeholder="Pega el texto copiado aquí" />

      <div className="flex gap-2 mb-4">
        <button onClick={parseInput} className="px-4 py-2 bg-purple-600 text-white rounded">Parsear</button>
        <button onClick={() => { setRawText(''); setParsed({ medio: [], final: [], medioTotal: null, finalTotal: null }); setMedioExam(null); setFinalExam(null); setIaResponse(null); }} className="px-4 py-2 bg-gray-200 rounded">Limpiar</button>
      </div>

      <div className="mb-4">
        <button id="iaExplain" className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={fetchExplain}>Explicación con IA</button>
        <small className="ml-2 text-gray-500">(requiere un servidor proxy con OPENAI_API_KEY)</small>
      </div>

      {iaResponse && (
        <pre className="p-3 bg-black text-white rounded mb-4 overflow-auto" style={{ maxHeight: 240 }}>{iaResponse}</pre>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 border rounded">
          <h3 className="font-medium">Medio ciclo</h3>
          <p className="text-lg font-bold">{(medioSum).toFixed(2)}</p>
          <div className="mt-2">{parsed.medio.map((n,i)=>(<span key={i} className="inline-block mr-2 text-sm text-gray-600">{n.toFixed(2)}</span>))}</div>
        </div>

        <div className="p-3 border rounded">
          <h3 className="font-medium">Final de ciclo</h3>
          <p className="text-lg font-bold">{(finalSum).toFixed(2)}</p>
          <div className="mt-2">{parsed.final.map((n,i)=>(<span key={i} className="inline-block mr-2 text-sm text-gray-600">{n.toFixed(2)}</span>))}</div>
        </div>

        <div className="p-3 border rounded">
          <h3 className="font-medium">Total</h3>
          <p className="text-lg font-bold">{total.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Meta mínima: 70 puntos</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm">Examen (medio ciclo)</label>
        <select className="border rounded p-2 w-full mb-2" value={medioExam ?? ""} onChange={(e)=>setMedioExam(e.target.value === "" ? null : Number(e.target.value))}>
          <option value="">-- Seleccionar --</option>
          {parsed.medio.map((n,i)=>(<option key={i} value={n}>{n.toFixed(2)}</option>))}
          {parsed.medio.length===0 && <option value="">No hay datos</option>}
        </select>

        <label className="block text-sm">Examen (final de ciclo)</label>
        <select className="border rounded p-2 w-full" value={finalExam ?? ""} onChange={(e)=>setFinalExam(e.target.value === "" ? null : Number(e.target.value))}>
          <option value="">-- Seleccionar --</option>
          {parsed.final.map((n,i)=>(<option key={i} value={n}>{n.toFixed(2)}</option>))}
          {parsed.final.length===0 && <option value="">No hay datos</option>}
        </select>
      </div>

      <div className="p-4 border rounded bg-gray-50">
        {isNaN(total) || total === 0 ? (
          <p className="text-sm text-gray-600">Pega tus notas y presiona "Parsear" para ver el cálculo.</p>
        ) : (
          <>
            <p className="mb-2">Total actual: <strong>{total.toFixed(2)}</strong></p>
            {total >= 70 ? (
              <p className="text-green-700 font-semibold">¡Con {total.toFixed(2)} has aprobado sin necesidad de supletorio!</p>
            ) : (
              <>
                <p className="mb-2">Aún no alcanzas 70 puntos.</p>
                {supleResult ? (
                  <>
                    <p>Nota más baja entre exámenes: <strong>{supleResult.lowerExam.toFixed(2)}</strong></p>
                    <p>Si restamos esa nota: <strong>{supleResult.adjustedTotal.toFixed(2)}</strong></p>
                    {supleResult.need <= 0 ? (
                      <p className="text-green-700 font-semibold">No necesitas supletorio (ajustes te dejan con {supleResult.adjustedTotal.toFixed(2)})</p>
                    ) : (
                      <p className="text-red-700 font-semibold">Necesitas al menos: {supleResult.need.toFixed(2)} puntos en el supletorio para llegar a 70.</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Selecciona al menos una nota de examen en los desplegables para calcular cuánto necesitas en el supletorio.</p>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <strong>Nota:</strong> El parser aplica heurísticas para agrupar notas. Si el resultado no es correcto, ajusta las selecciones de exámenes o pega un formato con etiquetas (por ejemplo: "medio: 32, final: 31").
      </div>
    </div>
  );
}
