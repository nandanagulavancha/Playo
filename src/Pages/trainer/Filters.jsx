const filters = [
    "Services", "Age", "Batch", "Coach Only", "Academy Only"
];

export default function Filters() {
    return (
        <div className="flex gap-3 my-6 flex-wrap">
            {filters.map(f => (
                <button
                    key={f}
                    className="bg-white border px-4 py-2 rounded-full text-sm hover:border-green-500"
                >
                    {f}
                </button>
            ))}
        </div>
    );
}
