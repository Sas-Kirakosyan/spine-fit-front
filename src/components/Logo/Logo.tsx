export function Logo({text}: {text?: string}) {
  return (
    <div className="flex items-center">
      <img src="/logo/logo.png" alt="logo" className="w-22 h-22" />
      <span className="font-semibold uppercase tracking-[0.34em] mb-4  text-white text-[26px]">
        SpineFit  
        <p className="text-[14px] tracking-[0]">{text}</p>
      </span>
    </div>
  );
}
