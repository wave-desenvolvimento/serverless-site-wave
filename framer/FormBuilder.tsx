import { addPropertyControls, ControlType } from "framer"
import { useState, useCallback, useId } from "react"

type FieldType =
    | "text"
    | "email"
    | "tel"
    | "url"
    | "number"
    | "textarea"
    | "select"
    | "radio"
    | "checkbox"
    | "currency"

interface FieldConfig {
    label: string
    name: string
    type: FieldType
    placeholder: string
    required: boolean
    options: string
    halfWidth: boolean
}

interface Props {
    endpoint: string
    fields: FieldConfig[]
    submitText: string
    loadingText: string
    successMessage: string
    errorMessage: string
    font: string
    fontSize: number
    fontWeight: number
    fontStyle: string
    textColor: string
    placeholderColor: string
    labelColor: string
    labelSize: number
    labelWeight: number
    labelUppercase: boolean
    labelSpacing: number
    inputBg: string
    inputBorder: string
    inputBorderRadius: number
    inputPaddingX: number
    inputPaddingY: number
    focusBorderColor: string
    optionColor: string
    buttonBg: string
    buttonColor: string
    buttonRadius: number
    buttonPaddingY: number
    buttonFontSize: number
    buttonFontWeight: number
    gap: number
    rowGap: number
    labelGap: number
    forceOneColumn: boolean
    mobileBreakpoint: number
    successColor: string
    errorColor: string
}

function formatCurrency(value: string): string {
    const num = value.replace(/\D/g, "")
    if (!num) return ""
    const cents = parseInt(num, 10)
    return (cents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    })
}

function formatPhone(value: string): string {
    const num = value.replace(/\D/g, "").slice(0, 11)
    if (num.length <= 2) return num
    if (num.length <= 7) return `(${num.slice(0, 2)}) ${num.slice(2)}`
    return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`
}

export default function FormBuilder(props: Props) {
    const {
        endpoint,
        fields = [],
        submitText,
        loadingText,
        successMessage,
        errorMessage,
        font,
        fontSize,
        fontWeight,
        fontStyle,
        textColor,
        placeholderColor,
        labelColor,
        labelSize,
        labelWeight,
        labelUppercase,
        labelSpacing,
        inputBg,
        inputBorder,
        inputBorderRadius,
        inputPaddingX,
        inputPaddingY,
        focusBorderColor,
        optionColor,
        buttonBg,
        buttonColor,
        buttonRadius,
        buttonPaddingY,
        buttonFontSize,
        buttonFontWeight,
        gap,
        rowGap,
        labelGap,
        forceOneColumn,
        mobileBreakpoint,
        successColor,
        errorColor,
    } = props

    const formId = useId().replace(/:/g, "")
    const [values, setValues] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle")

    const handleChange = useCallback(
        (name: string, raw: string, type: FieldType) => {
            let value = raw
            if (type === "currency") value = formatCurrency(raw)
            if (type === "tel") value = formatPhone(raw)
            setValues((prev) => ({ ...prev, [name]: value }))
        },
        []
    )

    const handleSubmit = useCallback(async () => {
        if (!endpoint) return
        setStatus("loading")
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })
            setStatus(res.ok ? "success" : "error")
            if (res.ok) setValues({})
        } catch {
            setStatus("error")
        }
    }, [endpoint, values])

    const css = `
        .fb-${formId} {
            display: grid;
            grid-template-columns: ${forceOneColumn ? "1fr" : "1fr 1fr"};
            gap: ${rowGap}px ${gap}px;
            width: 100%;
            box-sizing: border-box;
        }
        .fb-${formId} .fb-full { grid-column: 1 / -1; }
        .fb-${formId} input::placeholder,
        .fb-${formId} textarea::placeholder {
            color: ${placeholderColor};
            opacity: 1;
        }
        .fb-${formId} input:focus,
        .fb-${formId} textarea:focus,
        .fb-${formId} select:focus {
            border-color: ${focusBorderColor} !important;
            outline: none;
        }
        @media (max-width: ${mobileBreakpoint}px) {
            .fb-${formId} { grid-template-columns: 1fr; }
        }
    `

    const inputStyle: React.CSSProperties = {
        width: "100%",
        fontFamily: font,
        fontSize,
        fontWeight,
        fontStyle,
        color: textColor,
        backgroundColor: inputBg,
        border: `1px solid ${inputBorder}`,
        borderRadius: inputBorderRadius,
        padding: `${inputPaddingY}px ${inputPaddingX}px`,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
    }

    const labelStyle: React.CSSProperties = {
        fontFamily: font,
        fontSize: labelSize,
        fontWeight: labelWeight,
        color: labelColor,
        marginBottom: labelGap,
        display: "block",
        textTransform: labelUppercase ? "uppercase" : "none",
        letterSpacing: labelSpacing,
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

    const renderField = (field: FieldConfig, index: number) => {
        const { label, name, type, placeholder, required, options, halfWidth } =
            field
        const val = values[name] || ""
        const optionsList = options
            ? options.split(";").map((o) => o.trim())
            : []

        let input: React.ReactNode

        switch (type) {
            case "textarea":
                input = (
                    <textarea
                        style={{
                            ...inputStyle,
                            minHeight: 120,
                            resize: "vertical",
                        }}
                        placeholder={placeholder}
                        required={required}
                        value={val}
                        onChange={(e) =>
                            handleChange(name, e.target.value, type)
                        }
                    />
                )
                break

            case "select":
                input = (
                    <select
                        style={{
                            ...inputStyle,
                            cursor: "pointer",
                            appearance: "none",
                        }}
                        required={required}
                        value={val}
                        onChange={(e) =>
                            handleChange(name, e.target.value, type)
                        }
                    >
                        <option value="" disabled>
                            {placeholder || "Selecione..."}
                        </option>
                        {optionsList.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                )
                break

            case "radio":
                input = (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {optionsList.map((opt) => (
                            <label
                                key={opt}
                                style={{
                                    fontFamily: font,
                                    fontSize,
                                    color: optionColor,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="radio"
                                    name={name}
                                    value={opt}
                                    checked={val === opt}
                                    onChange={(e) =>
                                        handleChange(
                                            name,
                                            e.target.value,
                                            type
                                        )
                                    }
                                    style={{ accentColor: focusBorderColor }}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                )
                break

            case "checkbox":
                input = (
                    <label
                        style={{
                            fontFamily: font,
                            fontSize,
                            color: optionColor,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={val === "true"}
                            onChange={(e) =>
                                handleChange(
                                    name,
                                    String(e.target.checked),
                                    type
                                )
                            }
                            style={{ accentColor: focusBorderColor }}
                        />
                        {placeholder || label}
                    </label>
                )
                break

            case "currency":
                input = (
                    <input
                        type="text"
                        inputMode="numeric"
                        style={inputStyle}
                        placeholder={placeholder || "Ex: 100.000,00"}
                        required={required}
                        value={val}
                        onChange={(e) =>
                            handleChange(name, e.target.value, type)
                        }
                    />
                )
                break

            case "tel":
                input = (
                    <input
                        type="tel"
                        inputMode="numeric"
                        style={inputStyle}
                        placeholder={placeholder || "(00) 00000-0000"}
                        required={required}
                        value={val}
                        onChange={(e) =>
                            handleChange(name, e.target.value, type)
                        }
                    />
                )
                break

            default:
                input = (
                    <input
                        type={type}
                        style={inputStyle}
                        placeholder={placeholder}
                        required={required}
                        value={val}
                        onChange={(e) =>
                            handleChange(name, e.target.value, type)
                        }
                    />
                )
        }

        return (
            <div
                key={index}
                className={halfWidth ? "" : "fb-full"}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                }}
            >
                {type !== "checkbox" && (
                    <label style={labelStyle}>
                        {label}
                        {required && "*"}
                    </label>
                )}
                {input}
            </div>
        )
    }

    return (
        <>
            <style>{css}</style>
            <form
                className={`fb-${formId}`}
                onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmit()
                }}
            >
                {fields.map((field, i) => renderField(field, i))}

                <div className="fb-full">
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        style={{
                            width: "100%",
                            fontFamily: font,
                            fontSize: buttonFontSize,
                            fontWeight: buttonFontWeight,
                            color: buttonColor,
                            backgroundColor: buttonBg,
                            border: "none",
                            borderRadius: buttonRadius,
                            padding: `${buttonPaddingY}px 24px`,
                            cursor:
                                status === "loading" ? "wait" : "pointer",
                            opacity: status === "loading" ? 0.7 : 1,
                            transition: "opacity 0.2s",
                        }}
                    >
                        {status === "loading" ? loadingText : submitText}
                    </button>
                </div>

                {status === "error" && (
                    <div
                        className="fb-full"
                        style={{
                            fontFamily: font,
                            fontSize: fontSize * 0.875,
                            color: errorColor,
                            textAlign: "center",
                        }}
                    >
                        {errorMessage}
                    </div>
                )}
            </form>
        </>
    )
}

FormBuilder.defaultProps = {
    endpoint: "https://contrato-bay.vercel.app/api/webhook",
    fields: [
        {
            label: "Nome",
            name: "name",
            type: "text",
            placeholder: "Seu nome completo",
            required: true,
            options: "",
            halfWidth: true,
        },
        {
            label: "E-mail Corporativo",
            name: "email",
            type: "email",
            placeholder: "johndoe@minhaempresa.com.br",
            required: true,
            options: "",
            halfWidth: true,
        },
        {
            label: "Telefone / WhatsApp",
            name: "phone",
            type: "tel",
            placeholder: "(00) 00000-0000",
            required: true,
            options: "",
            halfWidth: true,
        },
        {
            label: "Nome da Empresa",
            name: "company",
            type: "text",
            placeholder: "Minha empresa",
            required: true,
            options: "",
            halfWidth: true,
        },
        {
            label: "Qual o faturamento mensal da sua empresa?",
            name: "revenue",
            type: "select",
            placeholder: "Selecione...",
            required: true,
            options: "0 a 99 mil; 100 mil a 499 mil; 500 mil a 999 mil; 1 milhao a 7 milhoes; Acima de 8 milhoes",
            halfWidth: false,
        },
        {
            label: "Qual plataforma voce utiliza no seu e-commerce?",
            name: "platform",
            type: "select",
            placeholder: "Selecione...",
            required: true,
            options: "Nao possuo; Shopify; VTEX; Outra",
            halfWidth: true,
        },
        {
            label: "Cargo",
            name: "role",
            type: "select",
            placeholder: "Selecione...",
            required: true,
            options: "Diretor; Proprietario; Gerente; Coordenador; Analista; Assistente",
            halfWidth: true,
        },
        {
            label: "Numero de funcionarios",
            name: "employees",
            type: "select",
            placeholder: "Selecione...",
            required: true,
            options: "1 a 5; 6 a 10; 11 a 20; 21 a 50; 51 a 100; Mais de 100",
            halfWidth: true,
        },
        {
            label: "Como voce conheceu a Wave Commerce?",
            name: "source",
            type: "select",
            placeholder: "Selecione...",
            required: true,
            options: "Indicacao; Instagram; LinkedIn; Google; Outro",
            halfWidth: true,
        },
        {
            label: "Gostaria de receber nossos e-mails com estrategias e materiais sobre marketing digital?",
            name: "newsletter",
            type: "radio",
            placeholder: "",
            required: true,
            options: "Sim; Nao",
            halfWidth: false,
        },
    ],
    submitText: "Enviar",
    loadingText: "Enviando...",
    successMessage: "Mensagem enviada com sucesso!",
    errorMessage: "Erro ao enviar. Tente novamente.",
    font: "Inter, sans-serif",
    fontSize: 14,
    fontWeight: 300,
    fontStyle: "italic",
    textColor: "#ffffff",
    placeholderColor: "#6b7280",
    labelColor: "#22d3ee",
    labelSize: 11,
    labelWeight: 600,
    labelUppercase: true,
    labelSpacing: 2,
    inputBg: "#ffffff",
    inputBorder: "#374151",
    inputBorderRadius: 8,
    inputPaddingX: 16,
    inputPaddingY: 16,
    focusBorderColor: "#22d3ee",
    optionColor: "#ffffff",
    buttonBg: "#2563eb",
    buttonColor: "#ffffff",
    buttonRadius: 30,
    buttonPaddingY: 16,
    buttonFontSize: 16,
    buttonFontWeight: 500,
    gap: 16,
    rowGap: 20,
    labelGap: 8,
    forceOneColumn: false,
    mobileBreakpoint: 600,
    successColor: "#22d3ee",
    errorColor: "#ef4444",
}

addPropertyControls(FormBuilder, {
    endpoint: {
        type: ControlType.String,
        title: "Webhook URL",
        defaultValue: FormBuilder.defaultProps.endpoint,
    },
    fields: {
        type: ControlType.Array,
        title: "Campos",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Campo",
                },
                name: {
                    type: ControlType.String,
                    title: "Name (key)",
                    defaultValue: "campo",
                },
                type: {
                    type: ControlType.Enum,
                    title: "Tipo",
                    options: [
                        "text",
                        "email",
                        "tel",
                        "url",
                        "number",
                        "textarea",
                        "select",
                        "radio",
                        "checkbox",
                        "currency",
                    ],
                    optionTitles: [
                        "Texto",
                        "Email",
                        "Telefone",
                        "URL",
                        "Numero",
                        "Textarea",
                        "Select",
                        "Radio",
                        "Checkbox",
                        "Moeda (R$)",
                    ],
                    defaultValue: "text",
                },
                placeholder: {
                    type: ControlType.String,
                    title: "Placeholder",
                    defaultValue: "",
                },
                required: {
                    type: ControlType.Boolean,
                    title: "Obrigatorio",
                    defaultValue: false,
                },
                options: {
                    type: ControlType.String,
                    title: "Opcoes (ponto e virgula)",
                    defaultValue: "",
                },
                halfWidth: {
                    type: ControlType.Boolean,
                    title: "Meia largura",
                    defaultValue: false,
                },
            },
        },
        defaultValue: FormBuilder.defaultProps.fields,
    },
    submitText: {
        type: ControlType.String,
        title: "Texto do botao",
        defaultValue: FormBuilder.defaultProps.submitText,
    },
    loadingText: {
        type: ControlType.String,
        title: "Texto carregando",
        defaultValue: FormBuilder.defaultProps.loadingText,
    },
    successMessage: {
        type: ControlType.String,
        title: "Msg de sucesso",
        defaultValue: FormBuilder.defaultProps.successMessage,
    },
    errorMessage: {
        type: ControlType.String,
        title: "Msg de erro",
        defaultValue: FormBuilder.defaultProps.errorMessage,
    },
    font: {
        type: ControlType.String,
        title: "Fonte",
        defaultValue: FormBuilder.defaultProps.font,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Tamanho fonte",
        min: 10,
        max: 24,
        step: 1,
        defaultValue: FormBuilder.defaultProps.fontSize,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Peso fonte",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: FormBuilder.defaultProps.fontWeight,
    },
    fontStyle: {
        type: ControlType.Enum,
        title: "Estilo fonte",
        options: ["normal", "italic"],
        optionTitles: ["Normal", "Italico"],
        defaultValue: FormBuilder.defaultProps.fontStyle,
    },
    textColor: {
        type: ControlType.Color,
        title: "Cor do texto",
        defaultValue: FormBuilder.defaultProps.textColor,
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Cor placeholder",
        defaultValue: FormBuilder.defaultProps.placeholderColor,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Cor do label",
        defaultValue: FormBuilder.defaultProps.labelColor,
    },
    labelSize: {
        type: ControlType.Number,
        title: "Tamanho label",
        min: 8,
        max: 18,
        step: 1,
        defaultValue: FormBuilder.defaultProps.labelSize,
    },
    labelWeight: {
        type: ControlType.Number,
        title: "Peso label",
        min: 300,
        max: 900,
        step: 100,
        defaultValue: FormBuilder.defaultProps.labelWeight,
    },
    labelUppercase: {
        type: ControlType.Boolean,
        title: "Label maiusculo",
        defaultValue: FormBuilder.defaultProps.labelUppercase,
    },
    labelSpacing: {
        type: ControlType.Number,
        title: "Espacamento label",
        min: 0,
        max: 8,
        step: 0.5,
        defaultValue: FormBuilder.defaultProps.labelSpacing,
    },
    inputBg: {
        type: ControlType.Color,
        title: "Fundo input",
        defaultValue: FormBuilder.defaultProps.inputBg,
    },
    inputBorder: {
        type: ControlType.Color,
        title: "Borda input",
        defaultValue: FormBuilder.defaultProps.inputBorder,
    },
    inputBorderRadius: {
        type: ControlType.Number,
        title: "Radius input",
        min: 0,
        max: 24,
        step: 1,
        defaultValue: FormBuilder.defaultProps.inputBorderRadius,
    },
    inputPaddingX: {
        type: ControlType.Number,
        title: "Padding X input",
        min: 4,
        max: 32,
        step: 2,
        defaultValue: FormBuilder.defaultProps.inputPaddingX,
    },
    inputPaddingY: {
        type: ControlType.Number,
        title: "Padding Y input",
        min: 4,
        max: 32,
        step: 2,
        defaultValue: FormBuilder.defaultProps.inputPaddingY,
    },
    focusBorderColor: {
        type: ControlType.Color,
        title: "Borda focus",
        defaultValue: FormBuilder.defaultProps.focusBorderColor,
    },
    optionColor: {
        type: ControlType.Color,
        title: "Cor opcoes (radio/check)",
        defaultValue: FormBuilder.defaultProps.optionColor,
    },
    buttonBg: {
        type: ControlType.Color,
        title: "Fundo botao",
        defaultValue: FormBuilder.defaultProps.buttonBg,
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Cor botao",
        defaultValue: FormBuilder.defaultProps.buttonColor,
    },
    buttonRadius: {
        type: ControlType.Number,
        title: "Radius botao",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: FormBuilder.defaultProps.buttonRadius,
    },
    buttonPaddingY: {
        type: ControlType.Number,
        title: "Padding Y botao",
        min: 8,
        max: 32,
        step: 2,
        defaultValue: FormBuilder.defaultProps.buttonPaddingY,
    },
    buttonFontSize: {
        type: ControlType.Number,
        title: "Fonte botao",
        min: 12,
        max: 24,
        step: 1,
        defaultValue: FormBuilder.defaultProps.buttonFontSize,
    },
    buttonFontWeight: {
        type: ControlType.Number,
        title: "Peso botao",
        min: 300,
        max: 900,
        step: 100,
        defaultValue: FormBuilder.defaultProps.buttonFontWeight,
    },
    gap: {
        type: ControlType.Number,
        title: "Espaco colunas",
        min: 4,
        max: 40,
        step: 2,
        defaultValue: FormBuilder.defaultProps.gap,
    },
    rowGap: {
        type: ControlType.Number,
        title: "Espaco linhas",
        min: 4,
        max: 40,
        step: 2,
        defaultValue: FormBuilder.defaultProps.rowGap,
    },
    labelGap: {
        type: ControlType.Number,
        title: "Espaco label/input",
        min: 0,
        max: 16,
        step: 1,
        defaultValue: FormBuilder.defaultProps.labelGap,
    },
    forceOneColumn: {
        type: ControlType.Boolean,
        title: "Forcar 1 coluna",
        defaultValue: FormBuilder.defaultProps.forceOneColumn,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Breakpoint mobile",
        min: 320,
        max: 1024,
        step: 10,
        defaultValue: FormBuilder.defaultProps.mobileBreakpoint,
        hidden: (props: any) => props.forceOneColumn,
    },
    successColor: {
        type: ControlType.Color,
        title: "Cor sucesso",
        defaultValue: FormBuilder.defaultProps.successColor,
    },
    errorColor: {
        type: ControlType.Color,
        title: "Cor erro",
        defaultValue: FormBuilder.defaultProps.errorColor,
    },
})
