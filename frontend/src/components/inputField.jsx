const InputField = ({
  label,
  id,
  name,
  type = "text",
  onChange,
  value,
  className = "",      // extra classes for the input
  rightElement,        // optional element rendered inside the input on the right
  ...rest
}) => {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative mt-1">
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`p-2 w-full border rounded-md text-black focus:border-gray-200
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
                      transition-colors duration-300 ${rightElement ? "pr-10" : ""} ${className}`}
          {...rest}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;
