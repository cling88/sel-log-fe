import { InlineInput } from "@/component/purchases/table-ui";

export function MemoField({
  value,
  editing,
  onChange,
  placeholder = "링크, 상품정보, 메모",
}: {
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  if (editing) {
    return (
      <InlineInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-[10rem]"
      />
    );
  }

  return (
    <span className="block max-w-[14rem] truncate text-zinc-600" title={value}>
      {value || "-"}
    </span>
  );
}
