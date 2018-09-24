FROM ubuntu:18.04

ENV DEBIAN_FRONTEND noninteractive

# Update apt sources
RUN apt-get update && apt-get install --no-install-recommends -y \
        tzdata \
        git \
        python \
        build-essential \
        locales \
        make \
        curl \
        procps \
        wget \
        vim \
        bzip2 \
        libfontconfig \
        ca-certificates \
        tree \
        gnupg

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash

RUN apt-get install -y nodejs
RUN rm -rf /var/lib/apt/lists/*

# Configure timezone
RUN echo "UTC" > /etc/timezone && \
    dpkg-reconfigure -f noninteractive tzdata

# Configure locales
RUN sed -i 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen
RUN /usr/sbin/locale-gen
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# /tmp doesn't have enough space, use /var/tmp instead
ENV TMPDIR /var/tmp

COPY app/package.json /app/package.json
RUN cd /app && npm install

# Move source files
COPY app/ /app/

WORKDIR /app
