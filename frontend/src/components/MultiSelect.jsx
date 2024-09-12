import Select from 'react-select';

export default function MultiSelect({ dataOptions, handleMultiSelectChange, selectedOptions }) {
  return (
    <div className="w-full">
      <Select
        isMulti
        name="nfts"
        value={selectedOptions}
        options={dataOptions}
        className="w-full"
        classNamePrefix="select"
        onChange={handleMultiSelectChange}
      />
    </div>
  );
}
