export default function Button({ text, onClick, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800",
    green: "from-green-500 to-green-700 hover:from-green-600 hover:to-green-800",
    red: "from-red-500 to-red-700 hover:from-red-600 hover:to-red-800",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-r ${colors[color]} text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 transform hover:scale-105 cursor-pointer`}
    >
      {text}
    </button>
  );
}
