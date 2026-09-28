"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Copy, FileText, Heart, HeartCrack, ImagePlus, Link2, LoaderCircle, Share2, Sparkles, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { publishLovePage, type PublishState } from "@/actions/publish";
import { PhotoEditor } from "@/components/builder/photo-editor";
import { TurnstileWidget } from "@/components/builder/turnstile-widget";
import { LoveGame } from "@/components/game/love-game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CERTIFICATE_ACCEPT, formatFileSize, isPdfFileMetadata } from "@/lib/certificate";
import { lovePageDefaultValues, lovePageSchema, type LovePageInput } from "@/lib/love-page-schema";
import { DEFAULT_PHOTO_CROP, type PhotoCrop } from "@/lib/photo-crop";
import { cn } from "@/lib/utils";

const initialPublishState: PublishState = { status: "idle" };
const steps = ["Посвящение", "Сценарий", "Предпросмотр"];

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // HTTP pages and some mobile browsers reject the modern Clipboard API.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs text-[#e99bb2]">{message}</p> : null;
}

export function Builder() {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoCrop, setPhotoCrop] = useState<PhotoCrop>({ ...DEFAULT_PHOTO_CROP });
  const photoPreviewRef = useRef("");
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState("");
  const certificatePreviewRef = useRef("");
  const [attachmentError, setAttachmentError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [publishState, setPublishState] = useState(initialPublishState);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const form = useForm<LovePageInput>({
    resolver: zodResolver(lovePageSchema),
    mode: "onBlur",
    defaultValues: lovePageDefaultValues,
  });

  const values = useWatch({
    control: form.control,
    defaultValue: lovePageDefaultValues,
  }) as LovePageInput;
  const verifyTurnstile = useCallback((token: string) => setTurnstileToken(token), []);

  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
      if (certificatePreviewRef.current) URL.revokeObjectURL(certificatePreviewRef.current);
    };
  }, []);

  const chooseAttachment = (file?: File) => {
    if (!file) return;

    const isPhoto = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (isPhoto && file.size <= 5 * 1024 * 1024) {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
      if (certificatePreviewRef.current) URL.revokeObjectURL(certificatePreviewRef.current);
      const previewUrl = URL.createObjectURL(file);
      photoPreviewRef.current = previewUrl;
      certificatePreviewRef.current = "";
      setPhotoPreview(previewUrl);
      setPhoto(file);
      setPhotoCrop({ ...DEFAULT_PHOTO_CROP });
      setCertificate(null);
      setCertificatePreview("");
      setAttachmentError("");
      return;
    }

    if (isPdfFileMetadata(file)) {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
      if (certificatePreviewRef.current) URL.revokeObjectURL(certificatePreviewRef.current);
      const previewUrl = URL.createObjectURL(file);
      photoPreviewRef.current = "";
      certificatePreviewRef.current = previewUrl;
      setPhoto(null);
      setPhotoPreview("");
      setPhotoCrop({ ...DEFAULT_PHOTO_CROP });
      setCertificate(file);
      setCertificatePreview(previewUrl);
      setAttachmentError("");
      return;
    }

    if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    if (certificatePreviewRef.current) URL.revokeObjectURL(certificatePreviewRef.current);
    photoPreviewRef.current = "";
    certificatePreviewRef.current = "";
    setPhoto(null);
    setPhotoPreview("");
    setPhotoCrop({ ...DEFAULT_PHOTO_CROP });
    setCertificate(null);
    setCertificatePreview("");
    setAttachmentError("Фото — до 5 МБ, PDF — до 10 МБ");
  };

  const removeAttachment = () => {
    if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    if (certificatePreviewRef.current) URL.revokeObjectURL(certificatePreviewRef.current);
    photoPreviewRef.current = "";
    certificatePreviewRef.current = "";
    setPhoto(null);
    setPhotoPreview("");
    setPhotoCrop({ ...DEFAULT_PHOTO_CROP });
    setCertificate(null);
    setCertificatePreview("");
    setAttachmentError("");
  };

  const goNext = async () => {
    const fields: (keyof LovePageInput)[] =
      step === 0
        ? ["recipientName", "introText", "senderName"]
        : ["complimentOne", "complimentTwo", "prizeTitle", "prizeMessage"];
    const valid = await form.trigger(fields);
    if (step === 0 && !photo && !certificate) {
      setAttachmentError("Добавьте фотографию или PDF-сертификат");
    }
    if (!valid || (step === 0 && !photo && !certificate)) return;
    setStep((current) => Math.min(2, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const publish = form.handleSubmit((data) => {
    if ((!photo && !certificate) || !turnstileToken) return;
    const payload = new FormData();
    Object.entries(data).forEach(([key, value]) => payload.append(key, value));
    if (photo) payload.append("photo", photo);
    if (certificate) payload.append("certificate", certificate);
    payload.append("photoCropX", String(photoCrop.x));
    payload.append("photoCropY", String(photoCrop.y));
    payload.append("photoCropZoom", String(photoCrop.zoom));
    payload.append("turnstileToken", turnstileToken);
    setPublishState(initialPublishState);

    startTransition(async () => {
      let succeeded = false;
      try {
        const result = await publishLovePage(payload);
        setPublishState(result);
        succeeded = result.status === "success";
      } catch {
        setPublishState({ status: "error", message: "Не удалось создать ссылку. Проверьте соединение и попробуйте снова" });
      } finally {
        if (!succeeded) {
          setTurnstileToken("");
          setTurnstileKey((key) => key + 1);
        }
      }
    });
  });

  const shareUrl = publishState.slug
    ? `${typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL ?? "" : window.location.origin}/love/${publishState.slug}`
    : "";

  const copyLink = async () => {
    const success = await copyText(shareUrl);
    if (!success) {
      setCopyError("Браузер запретил копирование. Нажмите и удерживайте ссылку, чтобы скопировать её вручную.");
      return;
    }
    setCopyError("");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Для тебя 💌", text: "Я приготовил для тебя кое-что особенное", url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  if (publishState.status === "success") {
    return (
      <main className="velvet-bg grain flex min-h-[100svh] items-center justify-center px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl text-center">
          <div className="mx-auto mb-7 flex size-16 items-center justify-center rounded-full border border-[#e5c78c]/28 bg-[#e5c78c]/[0.07]">
            <Check className="size-7 text-[#e5c78c]" />
          </div>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-[#d48aa0]">История готова</p>
          <h1 className="font-display text-6xl font-semibold leading-[0.92] sm:text-8xl">Осталось только<br />отправить любовь</h1>
          <p className="mx-auto mt-6 max-w-md leading-7 text-[#cdb8b2]">
            Ссылка будет доступна 7 дней, затем вложение и все тексты удалятся автоматически.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.045] p-2 pl-4 text-left">
            <Link2 className="size-4 shrink-0 text-[#d48aa0]" />
            <span className="min-w-0 flex-1 select-all truncate text-sm text-[#eadbd2]">{shareUrl}</span>
            <Button size="icon" variant="ghost" onClick={copyLink} aria-label="Скопировать ссылку">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="accent" onClick={shareLink}><Share2 className="size-4" /> Поделиться</Button>
            <Button size="lg" variant="outline" asChild><a href={shareUrl}>Открыть открытку <ArrowRight className="size-4" /></a></Button>
          </div>
          {copyError ? <p className="mx-auto mt-4 max-w-md text-xs leading-5 text-[#e99bb2]" role="alert">{copyError}</p> : null}
          {publishState.expiresAt ? (
            <p className="mt-6 text-xs text-[#8f7880]">Доступна до {new Intl.DateTimeFormat("ru", { dateStyle: "long", timeStyle: "short" }).format(new Date(publishState.expiresAt))}</p>
          ) : null}
        </motion.div>
      </main>
    );
  }

  return (
    <main className="velvet-bg grain min-h-[100svh]">
      <header className="flex h-20 items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
        <div className="font-display flex items-center gap-2 text-2xl font-semibold tracking-[-0.02em]"><Heart className="size-5 fill-[#bd4f6c] text-[#d97b97]" /> LoveSpin</div>
        <p className="hidden text-xs text-[#9f878e] sm:block">Ссылка живёт 7 дней · без регистрации</p>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[minmax(0,560px)_minmax(520px,1fr)]">
        <section className="min-w-0 px-5 py-9 sm:px-10 lg:min-h-[calc(100svh-80px)] lg:border-r lg:border-white/[0.07] lg:px-14 lg:py-12">
          <div className="mb-10 flex items-center gap-2">
            {steps.map((label, index) => (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold", index <= step ? "border-[#bd4f6c] bg-[#bd4f6c] text-white" : "border-white/15 text-[#7e6970]")}>{index < step ? <Check className="size-3.5" /> : index + 1}</div>
                <span className={cn("hidden truncate text-xs sm:block", index === step ? "text-[#eadbd2]" : "text-[#7e6970]")}>{label}</span>
                {index < 2 ? <div className="h-px min-w-3 flex-1 bg-white/10" /> : null}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
              {step === 0 ? (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#d48aa0]">Шаг первый</p>
                  <h1 className="font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">Кому сегодня<br />улыбнётся любовь?</h1>
                  <p className="mt-5 max-w-md text-sm leading-6 text-[#a99299]">Добавьте несколько личных деталей. Фото или PDF-сертификат останется спрятанным до главного выигрыша.</p>
                  <div className="mt-9 space-y-6">
                    <div><Label htmlFor="recipientName">Её имя</Label><Input id="recipientName" placeholder="Например, Аня" {...form.register("recipientName")} /><FieldError message={form.formState.errors.recipientName?.message} /></div>
                    <div><Label htmlFor="introText">Пара слов перед началом</Label><Textarea id="introText" maxLength={160} {...form.register("introText")} /><FieldError message={form.formState.errors.introText?.message} /></div>
                    <div>
                      <Label htmlFor="attachment">Фото или PDF-сертификат</Label>
                      {photoPreview && photo ? (
                        <PhotoEditor
                          src={photoPreview}
                          fileName={photo.name}
                          inputId="attachment"
                          crop={photoCrop}
                          onCropChange={setPhotoCrop}
                        />
                      ) : certificatePreview && certificate ? (
                        <div className="flex items-center gap-4 rounded-2xl border border-[#e5c78c]/20 bg-[#e5c78c]/[0.045] p-4">
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e5c78c]/10">
                            <FileText className="size-5 text-[#e5c78c]" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#eadbd2]">{certificate.name}</p>
                            <p className="mt-1 text-xs text-[#806b72]">PDF · {formatFileSize(certificate.size)}</p>
                          </div>
                          <label htmlFor="attachment" className="shrink-0 cursor-pointer rounded-full border border-white/12 px-3 py-2 text-[11px] font-semibold text-[#d9c5bf] transition hover:border-[#d48aa0]/40 hover:bg-white/[0.04]">
                            Заменить
                          </label>
                          <button type="button" onClick={removeAttachment} className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#9f878e] transition hover:bg-white/[0.06] hover:text-[#eadbd2]" aria-label="Удалить сертификат">
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="attachment" className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/16 bg-white/[0.025] p-3 transition hover:border-[#d48aa0]/45 hover:bg-white/[0.045]">
                          <span className="flex size-12 items-center justify-center rounded-full bg-white/[0.06]"><ImagePlus className="size-5 text-[#d48aa0]" /></span>
                          <span><span className="block text-sm font-semibold text-[#eadbd2]">Выбрать вложение</span><span className="mt-1 block text-xs text-[#806b72]">Фото до 5 МБ или PDF до 10 МБ</span></span>
                        </label>
                      )}
                      <input id="attachment" type="file" accept={`image/jpeg,image/png,image/webp,${CERTIFICATE_ACCEPT}`} className="sr-only" suppressHydrationWarning onChange={(event) => { chooseAttachment(event.target.files?.[0]); event.target.value = ""; }} />
                      <FieldError message={attachmentError} />
                    </div>
                    <div><Label htmlFor="senderName">От кого</Label><Input id="senderName" placeholder="Твоё имя" {...form.register("senderName")} /><FieldError message={form.formState.errors.senderName?.message} /></div>
                  </div>
                </div>
              ) : step === 1 ? (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#d48aa0]">Шаг второй</p>
                  <h1 className="font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">Три вращения.<br />Три повода улыбнуться.</h1>
                  <p className="mt-5 max-w-md text-sm leading-6 text-[#a99299]">Напишите две фразы, которые она получит после первого и второго спина. Главный подарок откроется на третьем.</p>
                  <div className="mt-6 flex items-center gap-3 border-y border-white/[0.07] py-3 text-xs leading-5 text-[#8e737c]">
                    <HeartCrack className="size-4 shrink-0 text-[#76515d]" />
                    <span>Разбитое сердце мелькнёт для интриги, но результатом не выпадет.</span>
                  </div>
                  <div className="mt-9 space-y-6">
                    <div className="relative border-l border-[#bd4f6c]/35 pl-5">
                      <span className="absolute -left-3 top-0 flex size-6 items-center justify-center rounded-full border border-[#bd4f6c]/45 bg-[#2b1019] text-[9px] font-bold text-[#dc8da4]">01</span>
                      <Label htmlFor="complimentOne" className="flex items-center justify-between gap-3">
                        <span>Фраза после первого спина</span>
                        <span className="text-[10px] font-normal tabular-nums text-[#715d64]">{values.complimentOne.length}/160</span>
                      </Label>
                      <Textarea id="complimentOne" maxLength={160} className="min-h-32" {...form.register("complimentOne")} />
                      <p className="mt-2 text-[11px] text-[#77636a]">Первый тёплый выигрыш — лучше коротко и очень лично.</p>
                      <FieldError message={form.formState.errors.complimentOne?.message} />
                    </div>
                    <div className="relative border-l border-[#bd4f6c]/35 pl-5">
                      <span className="absolute -left-3 top-0 flex size-6 items-center justify-center rounded-full border border-[#bd4f6c]/45 bg-[#2b1019] text-[9px] font-bold text-[#dc8da4]">02</span>
                      <Label htmlFor="complimentTwo" className="flex items-center justify-between gap-3">
                        <span>Фраза после второго спина</span>
                        <span className="text-[10px] font-normal tabular-nums text-[#715d64]">{values.complimentTwo.length}/160</span>
                      </Label>
                      <Textarea id="complimentTwo" maxLength={160} className="min-h-32" {...form.register("complimentTwo")} />
                      <p className="mt-2 text-[11px] text-[#77636a]">Вторая фраза усиливает ожидание перед главным подарком.</p>
                      <FieldError message={form.formState.errors.complimentTwo?.message} />
                    </div>
                    <div className="my-8 h-px bg-gradient-to-r from-white/12 to-transparent" />
                    <div><Label htmlFor="prizeTitle">Главный подарок</Label><Input id="prizeTitle" maxLength={80} {...form.register("prizeTitle")} /><FieldError message={form.formState.errors.prizeTitle?.message} /></div>
                    <div><Label htmlFor="prizeMessage">Как он исполнится</Label><Textarea id="prizeMessage" maxLength={240} {...form.register("prizeMessage")} /><FieldError message={form.formState.errors.prizeMessage?.message} /></div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#d48aa0]">Почти готово</p>
                  <h1 className="font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">Проживите историю<br />до отправки</h1>
                  <p className="mt-5 max-w-md text-sm leading-6 text-[#a99299]">Проверьте все три вращения в предпросмотре. После публикации изменить открытку уже нельзя.</p>
                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-[#e5c78c]" /><div><p className="text-sm font-semibold">Ссылка исчезнет через 7 дней</p><p className="mt-1 text-xs leading-5 text-[#8f7880]">Вместе с ней автоматически удалятся тексты и вложение.</p></div></div>
                  </div>
                  <div className="mt-7"><TurnstileWidget key={turnstileKey} onVerify={verifyTurnstile} /></div>
                  {publishState.message ? <p className="mt-4 text-sm text-[#e99bb2]" role="alert">{publishState.message}</p> : null}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {step === 2 && (photoPreview || certificatePreview) ? (
            <div className="mt-8 lg:hidden">
              <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[#715f65]">Интерактивный предпросмотр</p>
              <LoveGame data={values} photoUrl={photoPreview || undefined} photoCrop={photoCrop} certificateUrl={certificatePreview || undefined} certificateName={certificate?.name} compact />
            </div>
          ) : null}

          <div className="mt-10 flex items-center justify-between border-t border-white/[0.08] pt-6">
            <Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || isPending}><ArrowLeft className="size-4" /> Назад</Button>
            {step < 2 ? (
              <Button variant="accent" onClick={goNext}>Продолжить <ArrowRight className="size-4" /></Button>
            ) : (
              <Button variant="accent" onClick={publish} disabled={!turnstileToken || isPending}>
                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Heart className="size-4 fill-current" />}
                {isPending ? "Создаём…" : "Создать ссылку"}
              </Button>
            )}
          </div>
        </section>

        <aside className="hidden min-w-0 bg-[#12080c] p-6 lg:block">
          <div className="sticky top-6 mx-auto max-w-[690px]">
            <div className="mb-3 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#715f65]"><span>Живой предпросмотр</span><span>{step === 2 ? "Интерактивный" : "Финальный вид"}</span></div>
            {(photoPreview || certificatePreview) && values.recipientName && values.senderName ? (
              <LoveGame data={values} photoUrl={photoPreview || undefined} photoCrop={photoCrop} certificateUrl={certificatePreview || undefined} certificateName={certificate?.name} compact />
            ) : (
              <div className="velvet-bg flex min-h-[680px] items-center justify-center rounded-[34px] border border-white/[0.06] px-10 text-center"><div><Heart className="mx-auto size-7 text-[#6f3b4c]" /><p className="font-display mt-5 text-3xl text-[#8e747c]">Здесь появится<br />ваша история</p><p className="mt-3 text-xs text-[#5f4e54]">Добавьте имя, подпись и вложение</p></div></div>
            )}
          </div>
        </aside>
      </div>

    </main>
  );
}
