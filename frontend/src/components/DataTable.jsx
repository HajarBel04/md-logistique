export default function DataTable({ columns, data, rowKey, className = '' }) {
  const keyFn = rowKey || ((row, index) => row.id ?? row.name ?? index);
  const getCellValue = (column, row, index) => {
    if (typeof column.cell === 'function') {
      return column.cell(row, index);
    }
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] ?? '';
  };

  return (
    <div className={`overflow-x-auto rounded-[32px] border border-slate-200/80 bg-white shadow-soft border-slate-800 bg-slate-950 ${className}`}>
      <table className="min-w-full table-auto text-left text-sm text-slate-700 text-slate-300">
        <thead className="bg-slate-50 text-slate-600 bg-slate-900 text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="whitespace-nowrap px-5 py-4 text-sm font-semibold tracking-[0.02em] uppercase">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row, rowIndex) => (
              <tr key={keyFn(row, rowIndex)} className={rowIndex % 2 === 0 ? 'bg-white bg-slate-950' : 'bg-slate-50 bg-slate-900'}>
                {columns.map((column) => (
                  <td key={column.header} className="px-5 py-4 align-top text-slate-800 text-slate-200">
                    {getCellValue(column, row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-5 py-10 text-center text-sm text-slate-500 text-slate-400" colSpan={columns.length}>
                Aucune donnée disponible.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
