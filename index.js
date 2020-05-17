const app = new Vue({
    el: "#root", // https://wiki.selfhtml.org/wiki/JavaScript/Web_Storage & https://stackoverflow.com/questions/23344776/access-data-of-uploaded-json-file-using-javascript (import data as json file)
    data: {
        clock: "",
        timer: "",
        showSettings: false,
        btnSettingsText: "Show",
        config: {
            categories: [],
            design: {
                backgroundImage: "",
                color: "#343a40",
                opacity: 1
            }
        },
        search: "",
        categoryId: 1
    },
    methods: {
        getClock() {
            let date = new Date();
            this.clock = `${this.zeroPadding(date.getHours(), 2)}:${this.zeroPadding(date.getMinutes(), 2)}:${this.zeroPadding(date.getSeconds(), 2)}`
        },
        zeroPadding(num, digit) {
            let zero = '';

            for(let i = 0; i < digit; i++) {
                zero += '0';
            }

            return (zero + num).slice(-digit);
        },
        googleSearch(e) {
            e.preventDefault();

            let searchURL = `https://google.com/search?q=${encodeURI(this.search)}`;
            window.location.href = searchURL;
        },
        showSettingsClick() {
            this.showSettings = !this.showSettings;
            this.btnSettingsText = !this.showSettings ? "Show" : "Hide";
        },
        addCategory() {
            Swal.fire({
                title: "Add Category",
                text: "Category Name:",
                input: 'text',
                showCancelButton: true        
            }).then((result) => {
                if (result.value) {
                    let name = result.value;

                    if(!this.checkForCategory(name)) {
                        let id = this.getCategoryId();
                        this.config.categories.push({
                            "id": id,
                            "name": name,
                            "urls": []
                        });
                        
                        // Save categories
                        this.saveData();
                    } else {
                        Swal.fire(
                            "Error!",
                            "Category exists already!",
                            "error"
                        );
                    }
                }
            });
        },
        checkForCategory(name) {
            return this.config.categories.map(category => {
                return category.name.toLowerCase();
            }).includes(name.toLowerCase());
        },
        getCategoryId() {
            if(this.config.categories.length > 0) {
                return this.config.categories[this.config.categories.length - 1].id + 1;
            } else {
                return 1;
            }
        },
        async addUrl() {
            const { value: formValues } = await Swal.fire({
                title: "Add URL",
                html: `
                    <input type="text" class="mb-2 display-block mx-auto bg-dark" placeholder="Name" id="nameInput">
                    <input type="text" class="display-block mx-auto bg-dark" placeholder="https://bitgni.ch" value="https://" id="urlInput">
                `,
                focusConfirm: false,
                preConfirm: () => {
                    return [
                        document.getElementById("nameInput").value,
                        document.getElementById("urlInput").value
                    ];
                }
            });

            if(formValues) {
                try {
                    if(this.config.categories.length > 0) {
                        let categoryIndex = this.getCategoryIndex(this.categoryId);

                        if(categoryIndex > -1) {
                            this.config.categories[categoryIndex].urls.push({
                                "id": this.getUrlId(categoryIndex),
                                "name": formValues[0],
                                "url": formValues[1]
                            });
        
                            this.saveData();
                        }
                    } else {
                        Swal.fire(
                            "Error!",
                            "Please add a category first!",
                            "error"
                        );
                    }
                } catch(e) {
                    console.log(e);
                }
            }

        },
        getUrlId(categoryIndex) {
            if(this.config.categories[categoryIndex].urls.length > 0) {
                return this.config.categories[categoryIndex].urls[this.config.categories[categoryIndex].urls.length - 1].id + 1;
            } else {
                return 1;
            }
        },
        saveData() {
            try {
                localStorage.setItem("config", JSON.stringify(this.config));
            } catch(e) {
                Swal.fire(
                    "Error!",
                    "Your changes couldn't be applied",
                    "error"
                );
            }
        },
        loadData() {
            try {
                let data = localStorage.getItem("config");

                if(data) {
                    this.config = JSON.parse(data);
                }
            } catch(e) {
                Swal.fire(
                    "Error!",
                    "Your browser doesn't support webstorage",
                    "error"
                );
            }
        },
        exportSettings() {
            if(this.config) {
                let fileURL = window.URL.createObjectURL(new Blob([JSON.stringify(this.config)]));
                let fileLink = document.createElement('a');

                fileLink.href = fileURL;
                fileLink.setAttribute('download', 'export.json');
                document.body.appendChild(fileLink);

                fileLink.click();
                document.body.removeChild(fileLink);
            } else {
                Swal.fire(
                    "Error!",
                    "No data to export found!",
                    "error"
                );
            }
        },
        importSettings() {
            Swal.fire({
                title: "Import Settings",
                text: "File:",
                input: 'file',
                showCancelButton: true
            }).then(result => {
                if(result.value) {
                    this.readFileContent(result.value).then(content => {
                        let parsedContent = JSON.parse(content);

                        if(parsedContent) {
                            this.config = parsedContent;
                            this.saveData();
                        }
                    }).catch(error => console.log(error));
                }
            })
        },
        readFileContent(file) {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = event => resolve(event.target.result);
                reader.onerror = error => reject(error);
                reader.readAsText(file);
            });
        },
        deleteCategory(categoryId) {
            Swal.fire({
                title: "Delete Category?",
                text: "Are you sure?",
                icon: "question",
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'No don\'t',
                showCancelButton: true
            }).then(result => {
                if(result.value) {
                    let index = this.getCategoryIndex(categoryId);

                    if(index > -1) {
                        this.config.categories.splice(index, 1);
                        this.saveData();
                    } else {
                        Swal.fire(
                            "Error!",
                            "The category you tried to delete doesn't exist.",
                            "error"
                        );
                    }
                }
            });
        },
        removeUrl(categoryId, urlId) {
            Swal.fire({
                title: "Delete URL?",
                text: "Are you sure?",
                icon: "question",
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'No don\'t',
                showCancelButton: true
            }).then(result => {
                if(result.value) {
                    let categoryIndex = this.getCategoryIndex(categoryId);

                    if(categoryIndex > -1) {
                        let urlIndex = this.getUrlIndex(categoryIndex, urlId);
        
                        if(urlIndex > -1) {
                            this.config.categories[categoryIndex].urls.splice(urlIndex, 1);
                            this.saveData();
                        }
                    }
                }
            });
        },
        getCategoryIndex(categoryId) {
            let index = -1;

            for(let i = 0; i < this.config.categories.length; i++) {
                if(this.config.categories[i].id == categoryId) {
                    index = i;
                }
            }

            return index;
        },
        getUrlIndex(categoryIndex, urlId) {
            let index = -1;

            for(let i = 0; i < this.config.categories[categoryIndex].urls.length; i++) {
                if(this.config.categories[categoryIndex].urls[i].id == urlId) {
                    index = i;
                }
            }

            return index;
        },
        changeBackgroundImage() {
            let file = this.$refs.backgroundImage.files[0];

            if(file) {
                this.readFileContentBase64(file).then(data => {
                    this.config.design.backgroundImage = data;
                    this.saveData();
                    this.$refs.backgroundImage.type = 'text';
                    this.$refs.backgroundImage.type = 'file';
                }).catch(error => console.log(error));
            }
        },
        readFileContentBase64(file) {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = event => resolve(event.target.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        }
    },
    computed: {
        bgColor() {
            return `rgba(${parseInt(this.config.design.color.slice(-6, -4), 16)}, ${parseInt(this.config.design.color.slice(-4, -2), 16)}, ${parseInt(this.config.design.color.slice(-2), 16)}, ${this.config.design.opacity.toString(16)})`;
        }
    },
    mounted() {
        setInterval(() => {
            this.getClock();
        }, 1);
        this.loadData();
    }
});