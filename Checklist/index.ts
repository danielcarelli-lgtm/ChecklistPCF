import {IInputs, IOutputs} from "./generated/ManifestTypes";

export class Checklist implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _notifyOutputChanged: () => void;
    private _container: HTMLDivElement;

    // Elementos visuales estáticos
    private _titleElement: HTMLHeadingElement;
    private _statusIcon: HTMLSpanElement;
    private _boundValueInput: HTMLInputElement;
    private _btnMinus: HTMLButtonElement;
    private _btnPlus: HTMLButtonElement;
    private _tiempoTextarea: HTMLTextAreaElement;
    private _versionElement: HTMLDivElement;

    // Contenedores para los grupos de botones de los OptionSets
    private _funcionamientoContainer: HTMLDivElement;
    private _limpiezaContainer: HTMLDivElement;
    private _statusContainer: HTMLDivElement;
    private _chequeoFechaContainer: HTMLDivElement;

    // Almacenamiento de referencias de botones para actualizar estilos dinámicamente
    private _funcionamientoButtons: HTMLButtonElement[] = [];
    private _limpiezaButtons: HTMLButtonElement[] = [];
    private _statusButtons: HTMLButtonElement[] = [];
    private _chequeoFechaButtons: HTMLButtonElement[] = [];

    // Variables de estado
    private _boundValue: number | null;
    private _val_funcionamiento: number | null;
    private _val_limpieza: number | null;
    private _val_status: number | null;
    private _val_chequeo_fecha: number | null;
    private _val_tiempo: string | null;

    // Límites del campo numérico Dataverse
    private _minValue: number;
    private _maxValue: number;

    // Temporizadores para suma/resta continua
    private _holdTimeout: number | null = null;
    private _holdInterval: number | null = null;

    // Bandera para asegurar la carga única de los botones de opciones
    private _optionsLoaded = false;

    // Referencias a manejadores vinculados (para poder destruirlos correctamente)
    private _boundStartMinus: (evt: Event) => void;
    private _boundStartPlus: (evt: Event) => void;
    private _boundStopHold: () => void;

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): void {
        this._notifyOutputChanged = notifyOutputChanged;
        this._container = container;

        // Inicializar límites por defecto
        this._minValue = Number.MIN_SAFE_INTEGER;
        this._maxValue = Number.MAX_SAFE_INTEGER;

        // Vincular manejadores de eventos para uso y limpieza
        this._boundStartMinus = this.startMinusHold.bind(this);
        this._boundStartPlus = this.startPlusHold.bind(this);
        this._boundStopHold = this.stopHold.bind(this);

        // Tonalidad gris de fondo al área donde se aloja el control
        this._container.style.backgroundColor = "#f8f9fa";
        this._container.style.padding = "6px"; // Espacio aún más reducido
        this._container.style.boxSizing = "border-box";

        // Contenedor principal de la tarjeta
        const card = document.createElement("div");
        card.style.border = "1px solid #e0e0e0";
        card.style.borderRadius = "8px";
        card.style.padding = "14px"; // Relleno interno muy ajustado
        card.style.fontFamily = "Segoe UI, Tahoma, sans-serif";
        card.style.backgroundColor = "#ffffff";
        card.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.05)";
        card.style.boxSizing = "border-box";
        card.style.width = "100%";
        card.style.position = "relative";
        card.style.paddingBottom = "28px"; 
        
        // Propiedades Flex
        card.style.display = "flex";
        card.style.flexWrap = "wrap";
        card.style.gap = "8px"; // Gap muy compacto
        card.style.alignItems = "flex-start";

        // Fila de Título e Icono de Completitud
        const titleRow = document.createElement("div");
        titleRow.style.display = "flex";
        titleRow.style.justifyContent = "space-between";
        titleRow.style.alignItems = "center";
        titleRow.style.width = "100%";
        titleRow.style.marginBottom = "4px";

        this._titleElement = document.createElement("h3");
        this._titleElement.style.margin = "0";
        this._titleElement.style.color = "#222222";
        this._titleElement.style.fontSize = "16px";
        
        this._statusIcon = document.createElement("span");
        this._statusIcon.style.display = "flex";
        this._statusIcon.style.alignItems = "center";
        this._statusIcon.style.gap = "6px";
        
        titleRow.appendChild(this._titleElement);
        titleRow.appendChild(this._statusIcon);
        card.appendChild(titleRow);

        // --- Campo: Cantidad (Numérico) ---
        const qtyWrapper = document.createElement("div");
        qtyWrapper.style.display = "flex";
        qtyWrapper.style.alignItems = "center";

        this._btnMinus = document.createElement("button");
        this._btnMinus.type = "button";
        this._btnMinus.innerText = "-";
        this.applyQuantityButtonStyle(this._btnMinus);
        this.attachHoldListeners(this._btnMinus, this._boundStartMinus);

        this._boundValueInput = document.createElement("input");
        this._boundValueInput.type = "number";
        this._boundValueInput.style.width = "70px"; 
        this._boundValueInput.style.height = "44px"; 
        this._boundValueInput.style.textAlign = "center";
        this._boundValueInput.style.fontSize = "16px";
        this._boundValueInput.style.border = "1px solid #ccc";
        this._boundValueInput.style.margin = "0 8px";
        this._boundValueInput.style.borderRadius = "6px";
        this._boundValueInput.style.boxSizing = "border-box";
        this._boundValueInput.addEventListener("change", this.onNumberChange.bind(this));

        this._btnPlus = document.createElement("button");
        this._btnPlus.type = "button";
        this._btnPlus.innerText = "+";
        this.applyQuantityButtonStyle(this._btnPlus);
        this.attachHoldListeners(this._btnPlus, this._boundStartPlus);

        qtyWrapper.appendChild(this._btnMinus);
        qtyWrapper.appendChild(this._boundValueInput);
        qtyWrapper.appendChild(this._btnPlus);

        card.appendChild(this.createFieldContainer(context.parameters.label_boundValue.raw || "Cantidad", qtyWrapper, "1 1 180px"));

        // --- Fila Exclusiva para Funcionamiento y Limpieza (Fuerza mismo renglón) ---
        const rowFuncLimp = document.createElement("div");
        rowFuncLimp.style.display = "flex";
        rowFuncLimp.style.width = "100%"; // Obliga a ocupar la línea entera
        rowFuncLimp.style.gap = "8px";
        
        this._funcionamientoContainer = document.createElement("div");
        this._funcionamientoContainer.style.display = "flex";
        this._funcionamientoContainer.style.flexWrap = "wrap";
        rowFuncLimp.appendChild(this.createFieldContainer(context.parameters.label_funcionamiento.raw || "En funcionamiento", this._funcionamientoContainer, "1 1 0"));

        this._limpiezaContainer = document.createElement("div");
        this._limpiezaContainer.style.display = "flex";
        this._limpiezaContainer.style.flexWrap = "wrap";
        rowFuncLimp.appendChild(this.createFieldContainer(context.parameters.label_limpieza.raw || "Limpieza", this._limpiezaContainer, "1 1 0"));

        card.appendChild(rowFuncLimp);

        // --- Campo: Chequeo Fecha ---
        this._chequeoFechaContainer = document.createElement("div");
        this._chequeoFechaContainer.style.display = "flex";
        this._chequeoFechaContainer.style.flexWrap = "wrap";
        card.appendChild(this.createFieldContainer(context.parameters.label_chequeo_fecha.raw || "Chequeo fecha/hora", this._chequeoFechaContainer, "1 1 200px"));

        // --- Campo: Status ---
        this._statusContainer = document.createElement("div");
        this._statusContainer.style.display = "flex";
        this._statusContainer.style.flexWrap = "wrap";
        card.appendChild(this.createFieldContainer(context.parameters.label_status.raw || "Estatus grabación", this._statusContainer, "1 1 200px"));

        // --- Campo: Tiempo ---
        this._tiempoTextarea = document.createElement("textarea");
        this._tiempoTextarea.rows = 2;
        this._tiempoTextarea.style.resize = "vertical";
        this._tiempoTextarea.style.padding = "8px";
        this._tiempoTextarea.style.fontSize = "14px";
        this._tiempoTextarea.style.border = "1px solid #ccc";
        this._tiempoTextarea.style.borderRadius = "6px";
        this._tiempoTextarea.style.width = "100%";
        this._tiempoTextarea.style.boxSizing = "border-box";
        this._tiempoTextarea.addEventListener("change", this.onTiempoChange.bind(this));
        
        card.appendChild(this.createFieldContainer(context.parameters.label_tiempo.raw || "Tiempo grabación", this._tiempoTextarea, "1 1 250px"));

        // Versionado
        this._versionElement = document.createElement("div");
        this._versionElement.innerText = "v1.0.9";
        this._versionElement.style.position = "absolute";
        this._versionElement.style.bottom = "6px";
        this._versionElement.style.right = "10px";
        this._versionElement.style.fontSize = "10px";
        this._versionElement.style.color = "#c0c0c0";
        this._versionElement.style.userSelect = "none";
        card.appendChild(this._versionElement);

        this._container.appendChild(card);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        // Generar dinámicamente los botones si no se han cargado aún
        if (!this._optionsLoaded) {
            this.renderOptionSetButtons(this._funcionamientoContainer, context.parameters.val_funcionamiento, this._funcionamientoButtons, (val) => {
                this._val_funcionamiento = val;
                this.checkCompleteness();
                this._notifyOutputChanged();
            });
            this.renderOptionSetButtons(this._limpiezaContainer, context.parameters.val_limpieza, this._limpiezaButtons, (val) => {
                this._val_limpieza = val;
                this.checkCompleteness();
                this._notifyOutputChanged();
            });
            this.renderOptionSetButtons(this._statusContainer, context.parameters.val_status, this._statusButtons, (val) => {
                this._val_status = val;
                this.checkCompleteness();
                this._notifyOutputChanged();
            });
            this.renderOptionSetButtons(this._chequeoFechaContainer, context.parameters.val_chequeo_fecha, this._chequeoFechaButtons, (val) => {
                this._val_chequeo_fecha = val;
                this.checkCompleteness();
                this._notifyOutputChanged();
            });
            this._optionsLoaded = true;
        }

        // Obtener límites del campo numérico desde Dataverse
        this._minValue = context.parameters.boundValue.attributes?.MinValue ?? Number.MIN_SAFE_INTEGER;
        this._maxValue = context.parameters.boundValue.attributes?.MaxValue ?? Number.MAX_SAFE_INTEGER;

        // Sincronizar Título
        this._titleElement.innerText = context.parameters.titulo_tarjeta.raw || "Checklist";

        // Sincronizar Cantidad y protegerla con límites
        let rawVal = context.parameters.boundValue.raw;
        if (rawVal !== null) {
            if (rawVal < this._minValue) rawVal = this._minValue;
            if (rawVal > this._maxValue) rawVal = this._maxValue;
            this._boundValue = rawVal;
        } else {
            this._boundValue = null;
        }

        const fallbackMinDisplay = this._minValue !== Number.MIN_SAFE_INTEGER ? this._minValue.toString() : "0";
        this._boundValueInput.value = this._boundValue !== null ? this._boundValue.toString() : fallbackMinDisplay;

        // Sincronizar Estados de Selección en los grupos de botones
        this._val_funcionamiento = context.parameters.val_funcionamiento.raw;
        this.updateButtonSelectionStates(this._funcionamientoButtons, this._val_funcionamiento);

        this._val_limpieza = context.parameters.val_limpieza.raw;
        this.updateButtonSelectionStates(this._limpiezaButtons, this._val_limpieza);

        this._val_status = context.parameters.val_status.raw;
        this.updateButtonSelectionStates(this._statusButtons, this._val_status);

        this._val_chequeo_fecha = context.parameters.val_chequeo_fecha.raw;
        this.updateButtonSelectionStates(this._chequeoFechaButtons, this._val_chequeo_fecha);

        // Sincronizar campo multilínea
        this._val_tiempo = context.parameters.val_tiempo.raw;
        this._tiempoTextarea.value = this._val_tiempo !== null ? this._val_tiempo : "";

        // Revisar si los campos están completos
        this.checkCompleteness();
    }

    public getOutputs(): IOutputs {
        return {
            boundValue: this._boundValue ?? undefined,
            val_funcionamiento: this._val_funcionamiento ?? undefined,
            val_limpieza: this._val_limpieza ?? undefined,
            val_status: this._val_status ?? undefined,
            val_chequeo_fecha: this._val_chequeo_fecha ?? undefined,
            val_tiempo: this._val_tiempo ?? undefined
        };
    }

    public destroy(): void {
        this.detachHoldListeners(this._btnMinus, this._boundStartMinus);
        this.detachHoldListeners(this._btnPlus, this._boundStartPlus);
        this._boundValueInput.removeEventListener("change", this.onNumberChange);
        this._tiempoTextarea.removeEventListener("change", this.onTiempoChange);
        this.stopHold(); // Limpiar timers por si la tarjeta se destruye mientras se presiona
    }

    // --- Lógica de Completitud Visual ---
    private checkCompleteness(): void {
        const isComplete = 
            this._boundValue !== null &&
            this._val_funcionamiento !== null &&
            this._val_limpieza !== null &&
            this._val_status !== null &&
            this._val_chequeo_fecha !== null &&
            this._val_tiempo !== null && 
            this._val_tiempo.trim() !== "";

        this._statusIcon.innerHTML = "";
        
        const iconNode = document.createTextNode(isComplete ? "✅ " : "⏳ ");
        const textSpan = document.createElement("span");
        textSpan.style.fontSize = "13px";
        textSpan.style.fontWeight = "600";
        textSpan.innerText = isComplete ? "Completo" : "Incompleto";
        textSpan.style.color = isComplete ? "#28a745" : "#dc3545";

        this._statusIcon.appendChild(iconNode);
        this._statusIcon.appendChild(textSpan);
    }

    // --- Lógica de Suma/Resta Continua (Hold) ---
    private attachHoldListeners(btn: HTMLButtonElement, startHandler: (evt: Event) => void): void {
        btn.addEventListener("mousedown", startHandler);
        btn.addEventListener("touchstart", startHandler, { passive: true });
        
        btn.addEventListener("mouseup", this._boundStopHold);
        btn.addEventListener("mouseleave", this._boundStopHold);
        btn.addEventListener("touchend", this._boundStopHold);
    }

    private detachHoldListeners(btn: HTMLButtonElement, startHandler: (evt: Event) => void): void {
        btn.removeEventListener("mousedown", startHandler);
        btn.removeEventListener("touchstart", startHandler);
        
        btn.removeEventListener("mouseup", this._boundStopHold);
        btn.removeEventListener("mouseleave", this._boundStopHold);
        btn.removeEventListener("touchend", this._boundStopHold);
    }

    private startMinusHold(evt: Event): void {
        if (evt.type !== 'touchstart') evt.preventDefault(); // Evitar selección de texto en PC
        this.executeMinus();
        this._holdTimeout = window.setTimeout(() => {
            this._holdInterval = window.setInterval(() => this.executeMinus(), 80); // Velocidad de repetición
        }, 400); // Tiempo de espera antes de considerarlo "Hold"
    }

    private startPlusHold(evt: Event): void {
        if (evt.type !== 'touchstart') evt.preventDefault();
        this.executePlus();
        this._holdTimeout = window.setTimeout(() => {
            this._holdInterval = window.setInterval(() => this.executePlus(), 80);
        }, 400);
    }

    private stopHold(): void {
        if (this._holdTimeout !== null) {
            window.clearTimeout(this._holdTimeout);
            this._holdTimeout = null;
        }
        if (this._holdInterval !== null) {
            window.clearInterval(this._holdInterval);
            this._holdInterval = null;
        }
    }

    private executeMinus(): void {
        const current = this._boundValue ?? (this._minValue !== Number.MIN_SAFE_INTEGER ? this._minValue : 0);
        if (current > this._minValue) {
            this._boundValue = current - 1;
            this._boundValueInput.value = this._boundValue.toString();
            this.checkCompleteness();
            this._notifyOutputChanged();
        } else {
            this.stopHold(); // Si llega al límite, frenar el loop
        }
    }

    private executePlus(): void {
        const current = this._boundValue ?? (this._minValue !== Number.MIN_SAFE_INTEGER ? this._minValue : 0);
        if (current < this._maxValue) {
            this._boundValue = current + 1;
            this._boundValueInput.value = this._boundValue.toString();
            this.checkCompleteness();
            this._notifyOutputChanged();
        } else {
            this.stopHold();
        }
    }

    private onNumberChange = (evt: Event): void => {
        const valStr = (evt.target as HTMLInputElement).value;
        let val = valStr ? parseInt(valStr, 10) : null;
        
        if (val !== null) {
            if (val < this._minValue) val = this._minValue;
            if (val > this._maxValue) val = this._maxValue;
        }

        this._boundValue = val;
        this._boundValueInput.value = val !== null ? val.toString() : "";
        this.checkCompleteness();
        this._notifyOutputChanged();
    }

    private onTiempoChange = (evt: Event): void => {
        this._val_tiempo = (evt.target as HTMLTextAreaElement).value;
        this.checkCompleteness();
        this._notifyOutputChanged();
    }

    // --- Métodos de Renderizado y Estilos Auxiliares ---
    private applyQuantityButtonStyle(btn: HTMLButtonElement): void {
        btn.style.width = "44px"; 
        btn.style.height = "44px";
        btn.style.fontSize = "22px";
        btn.style.fontWeight = "bold";
        btn.style.border = "1px solid #cccccc";
        btn.style.borderRadius = "6px";
        btn.style.backgroundColor = "#f1f3f5";
        btn.style.cursor = "pointer";
        btn.style.userSelect = "none";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        
        // Efectos táctiles CSS (Feedback visual)
        btn.onmousedown = () => btn.style.backgroundColor = "#e2e6ea";
        btn.onmouseup = () => btn.style.backgroundColor = "#f1f3f5";
        btn.onmouseleave = () => btn.style.backgroundColor = "#f1f3f5";
    }

    private createFieldContainer(labelTxt: string, controlElement: HTMLElement, flexBasis: string): HTMLDivElement {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.flex = flexBasis;

        const label = document.createElement("label");
        label.innerText = labelTxt;
        label.style.fontWeight = "600";
        label.style.marginBottom = "4px"; // Ahorrando espacio
        label.style.fontSize = "13px";
        label.style.color = "#444444";
        container.appendChild(label);

        container.appendChild(controlElement);
        return container;
    }

    private renderOptionSetButtons(
        container: HTMLDivElement, 
        property: ComponentFramework.PropertyTypes.OptionSetProperty, 
        buttonArray: HTMLButtonElement[], 
        onClickCallback: (value: number | null) => void
    ): void {
        container.innerHTML = "";
        buttonArray.length = 0;

        if (property && property.attributes && property.attributes.Options) {
            property.attributes.Options.forEach(opt => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.innerText = opt.Label;
                btn.setAttribute("data-value", opt.Value.toString());
                
                // Estilos por defecto optimizados
                btn.style.padding = "8px 12px"; // Padding más ajustado
                btn.style.margin = "0 4px 4px 0"; // Margen más ajustado
                btn.style.fontSize = "13px"; // Fuente un pelo menor para encajar mejor
                btn.style.border = "1px solid #ced4da";
                btn.style.borderRadius = "6px";
                btn.style.backgroundColor = "#ffffff";
                btn.style.cursor = "pointer";
                btn.style.transition = "all 0.15s ease-in-out";
                btn.style.boxSizing = "border-box";

                btn.addEventListener("click", () => {
                    onClickCallback(opt.Value);
                });

                container.appendChild(btn);
                buttonArray.push(btn);
            });
        }
    }

    private updateButtonSelectionStates(buttonArray: HTMLButtonElement[], currentValue: number | null): void {
        buttonArray.forEach(btn => {
            const btnVal = btn.getAttribute("data-value");
            if (currentValue !== null && btnVal === currentValue.toString()) {
                btn.style.backgroundColor = "#005a9e"; 
                btn.style.color = "#ffffff";
                btn.style.borderColor = "#005a9e";
                btn.style.fontWeight = "600";
            } else {
                btn.style.backgroundColor = "#ffffff";
                btn.style.color = "#212529";
                btn.style.borderColor = "#ced4da";
                btn.style.fontWeight = "normal";
            }
        });
    }
}