import { addPropertyControls, ControlType } from "framer"
import { useState, useCallback } from "react"

interface Props {
    endpoint: string
    namePlaceholder: string
    emailPlaceholder: string
    submitText: string
    loadingText: string
    successMessage: string
    errorMessage: string
    font: string
    fontSize: number
    fontWeight: number
    textColor: string
    placeholderColor: string
    inputBg: string
    inputBorder: string
    inputBorderRadius: number
    inputPaddingX: number
    inputPaddingY: number
    focusBorderColor: string
    buttonBg: string
    buttonColor: string
    buttonRadius: number
    buttonPaddingY: number
    buttonFontSize: number
    buttonFontWeight: number
    gap: number
    layout: "horizontal" | "vertical"
    successColor: string
    errorColor: string
}

export default function Newsletter(props: Props) {
    const {
        endpoint,
        namePlaceholder,
        emailPlaceholder,
        submitText,
        loadingText,
        successMessage,
        errorMessage,
        font,
        fontSize,
        fontWeight,
        textColor,
        placeholderColor,
        inputBg,
        inputBorder,
        inputBorderRadius,
        inputPaddingX,
        inputPaddingY,
        focusBorderColor,
        buttonBg,
        buttonColor,
        buttonRadius,
        buttonPaddingY,
        buttonFontSize,
        buttonFontWeight,
        gap,
        layout,
        successColor,
        errorColor,
    } = props

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle")

    const handleSubmit = useCallback(async () => {
        if (!endpoint || !name.trim() || !email.trim()) return
        setStatus("loading")
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim() }),
            })
            setStatus(res.ok ? "success" : "error")
            if (res.ok) {
                setName("")
                setEmail("")
            }
        } catch {
            setStatus("error")
        }
    }, [endpoint, name, email])

    const inputStyle: React.CSSProperties = {
        flex: 1,
        minWidth: 0,
        fontFamily: font,
        fontSize,
        fontWeight,
        color: textColor,
        backgroundColor: inputBg,
        border: `1px solid ${inputBorder}`,
        borderRadius: inputBorderRadius,
        padding: `${inputPaddingY}px ${inputPaddingX}px`,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
    }

    if (status === "success") {
        return (
            <div
                style={{
                    fontFamily: font,
                    fontSize,
                    color: successColor,
                    textAlign: "center",
                    padding: 20,
                }}
            >
                {successMessage}
            </div>
        )
    }

    const isHorizontal = layout === "horizontal"

    return (
        <>
            <style>{`
                .nl-input::placeholder { color: ${placeholderColor}; opacity: 1; }
                .nl-input:focus { border-color: ${focusBorderColor} !important; outline: none; }
            `}</style>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmit()
                }}
                style={{
                    display: "flex",
                    flexDirection: isHorizontal ? "row" : "column",
                    gap,
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                <input
                    className="nl-input"
                    type="text"
                    placeholder={namePlaceholder}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                />
                <input
                    className="nl-input"
                    type="email"
                    placeholder={emailPlaceholder}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    style={{
                        fontFamily: font,
                        fontSize: buttonFontSize,
                        fontWeight: buttonFontWeight,
                        color: buttonColor,
                        backgroundColor: buttonBg,
                        border: "none",
                        borderRadius: buttonRadius,
                        padding: `${buttonPaddingY}px 24px`,
                        cursor: status === "loading" ? "wait" : "pointer",
                        opacity: status === "loading" ? 0.7 : 1,
                        transition: "opacity 0.2s",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}
                >
                    {status === "loading" ? loadingText : submitText}
                </button>
            </form>
            {status === "error" && (
                <div
                    style={{
                        fontFamily: font,
                        fontSize: fontSize * 0.875,
                        color: errorColor,
                        textAlign: "center",
                        marginTop: 8,
                    }}
                >
                    {errorMessage}
                </div>
            )}
        </>
    )
}

Newsletter.defaultProps = {
    endpoint: "https://contrato-bay.vercel.app/api/rd-newsletter",
    namePlaceholder: "Seu nome",
    emailPlaceholder: "Seu melhor e-mail",
    submitText: "Assinar",
    loadingText: "Enviando...",
    successMessage: "Inscrito com sucesso!",
    errorMessage: "Erro ao inscrever. Tente novamente.",
    font: "Inter, sans-serif",
    fontSize: 14,
    fontWeight: 400,
    textColor: "#ffffff",
    placeholderColor: "#6b7280",
    inputBg: "#ffffff",
    inputBorder: "#374151",
    inputBorderRadius: 8,
    inputPaddingX: 16,
    inputPaddingY: 12,
    focusBorderColor: "#22d3ee",
    buttonBg: "#2563eb",
    buttonColor: "#ffffff",
    buttonRadius: 30,
    buttonPaddingY: 12,
    buttonFontSize: 14,
    buttonFontWeight: 600,
    gap: 12,
    layout: "horizontal",
    successColor: "#22d3ee",
    errorColor: "#ef4444",
}

addPropertyControls(Newsletter, {
    endpoint: {
        type: ControlType.String,
        title: "Webhook URL",
        defaultValue: Newsletter.defaultProps.endpoint,
    },
    namePlaceholder: {
        type: ControlType.String,
        title: "Placeholder nome",
        defaultValue: Newsletter.defaultProps.namePlaceholder,
    },
    emailPlaceholder: {
        type: ControlType.String,
        title: "Placeholder email",
        defaultValue: Newsletter.defaultProps.emailPlaceholder,
    },
    submitText: {
        type: ControlType.String,
        title: "Texto botao",
        defaultValue: Newsletter.defaultProps.submitText,
    },
    loadingText: {
        type: ControlType.String,
        title: "Texto carregando",
        defaultValue: Newsletter.defaultProps.loadingText,
    },
    successMessage: {
        type: ControlType.String,
        title: "Msg sucesso",
        defaultValue: Newsletter.defaultProps.successMessage,
    },
    errorMessage: {
        type: ControlType.String,
        title: "Msg erro",
        defaultValue: Newsletter.defaultProps.errorMessage,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: Newsletter.defaultProps.layout,
    },
    font: {
        type: ControlType.String,
        title: "Fonte",
        defaultValue: Newsletter.defaultProps.font,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Tamanho fonte",
        min: 10,
        max: 24,
        step: 1,
        defaultValue: Newsletter.defaultProps.fontSize,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Peso fonte",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: Newsletter.defaultProps.fontWeight,
    },
    textColor: {
        type: ControlType.Color,
        title: "Cor texto",
        defaultValue: Newsletter.defaultProps.textColor,
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Cor placeholder",
        defaultValue: Newsletter.defaultProps.placeholderColor,
    },
    inputBg: {
        type: ControlType.Color,
        title: "Fundo input",
        defaultValue: Newsletter.defaultProps.inputBg,
    },
    inputBorder: {
        type: ControlType.Color,
        title: "Borda input",
        defaultValue: Newsletter.defaultProps.inputBorder,
    },
    inputBorderRadius: {
        type: ControlType.Number,
        title: "Radius input",
        min: 0,
        max: 24,
        step: 1,
        defaultValue: Newsletter.defaultProps.inputBorderRadius,
    },
    inputPaddingX: {
        type: ControlType.Number,
        title: "Padding X input",
        min: 4,
        max: 32,
        step: 2,
        defaultValue: Newsletter.defaultProps.inputPaddingX,
    },
    inputPaddingY: {
        type: ControlType.Number,
        title: "Padding Y input",
        min: 4,
        max: 32,
        step: 2,
        defaultValue: Newsletter.defaultProps.inputPaddingY,
    },
    focusBorderColor: {
        type: ControlType.Color,
        title: "Borda focus",
        defaultValue: Newsletter.defaultProps.focusBorderColor,
    },
    buttonBg: {
        type: ControlType.Color,
        title: "Fundo botao",
        defaultValue: Newsletter.defaultProps.buttonBg,
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Cor botao",
        defaultValue: Newsletter.defaultProps.buttonColor,
    },
    buttonRadius: {
        type: ControlType.Number,
        title: "Radius botao",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: Newsletter.defaultProps.buttonRadius,
    },
    buttonPaddingY: {
        type: ControlType.Number,
        title: "Padding Y botao",
        min: 4,
        max: 32,
        step: 2,
        defaultValue: Newsletter.defaultProps.buttonPaddingY,
    },
    buttonFontSize: {
        type: ControlType.Number,
        title: "Fonte botao",
        min: 10,
        max: 24,
        step: 1,
        defaultValue: Newsletter.defaultProps.buttonFontSize,
    },
    buttonFontWeight: {
        type: ControlType.Number,
        title: "Peso botao",
        min: 300,
        max: 900,
        step: 100,
        defaultValue: Newsletter.defaultProps.buttonFontWeight,
    },
    gap: {
        type: ControlType.Number,
        title: "Espaco entre campos",
        min: 4,
        max: 32,
        step: 2,
        defaultValue: Newsletter.defaultProps.gap,
    },
    successColor: {
        type: ControlType.Color,
        title: "Cor sucesso",
        defaultValue: Newsletter.defaultProps.successColor,
    },
    errorColor: {
        type: ControlType.Color,
        title: "Cor erro",
        defaultValue: Newsletter.defaultProps.errorColor,
    },
})
